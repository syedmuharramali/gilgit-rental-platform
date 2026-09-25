const mongoose = require("mongoose");

const Booking = require("../models/booking.model");
const Property = require("../models/property.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { safeCreateNotification } = require("../services/notification.service");
const { startOfGilgitToday } = require("../utils/gilgitDate");
const { isStayType } = require("../data/propertyTypes");
const {
  validateStayRange,
  checkInMoment,
  freeRoomsFor,
} = require("../utils/stayDates");
const {
  BOOKING_PROPERTY_FIELDS,
  findConfirmedOverlapping,
  getRoomAvailability,
  formatBooking,
} = require("../services/booking.service");

const CANCEL_CUTOFF_MS = 24 * 60 * 60 * 1000;

const populateBooking = (query) =>
  query
    .populate("property", BOOKING_PROPERTY_FIELDS)
    .populate("guest", "name email phone avatar")
    .populate("owner", "name email phone avatar");

const findPublishedStay = (propertyId) =>
  Property.findOne({
    _id: propertyId,
    listingStatus: "published",
    isDeleted: { $ne: true },
  });

const moneyText = (value) =>
  `PKR ${new Intl.NumberFormat("en-PK").format(Number(value) || 0)}`;

const dateText = (date) =>
  new Date(date).toISOString().slice(0, 10);

/*
|--------------------------------------------------------------------------
| Room availability for dates
| GET /api/bookings/availability/:propertyId?checkIn=&checkOut=
|--------------------------------------------------------------------------
*/

exports.getAvailability = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.propertyId)) {
    return next(new AppError("Invalid property ID", 400));
  }

  const property = await findPublishedStay(req.params.propertyId);

  if (!property || !isStayType(property.propertyType)) {
    return next(new AppError("Stay not found", 404));
  }

  const range = validateStayRange(
    req.query.checkIn,
    req.query.checkOut,
    startOfGilgitToday()
  );

  if (range.error) {
    return next(new AppError(range.error, 400));
  }

  const availability = await getRoomAvailability(
    property,
    range.checkIn,
    range.checkOut
  );

  res.status(200).json({
    success: true,
    data: {
      nights: range.nights,
      rooms: availability,
    },
  });
});

/*
|--------------------------------------------------------------------------
| Request a booking
| POST /api/bookings/:propertyId
|--------------------------------------------------------------------------
*/

exports.createBooking = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.propertyId)) {
    return next(new AppError("Invalid property ID", 400));
  }

  const property = await findPublishedStay(req.params.propertyId);

  if (!property || !isStayType(property.propertyType)) {
    return next(new AppError("Stay not found or not open for bookings", 404));
  }

  if (String(property.owner) === String(req.user._id)) {
    return next(new AppError("You cannot book your own stay", 400));
  }

  const room = (property.roomTypes || []).find(
    (roomType) => String(roomType._id) === String(req.body?.roomTypeId)
  );

  if (!room) {
    return next(new AppError("Choose one of this stay's room types", 400));
  }

  const range = validateStayRange(
    req.body?.checkIn,
    req.body?.checkOut,
    startOfGilgitToday()
  );

  if (range.error) {
    return next(new AppError(range.error, 400));
  }

  const rooms = Number(req.body?.rooms ?? 1);
  const guests = Number(req.body?.guests ?? 1);
  const maxParty = Math.min(room.maxGuests * rooms, 100);

  if (!Number.isInteger(rooms) || rooms < 1 || rooms > Math.min(room.quantity, 20)) {
    return next(
      new AppError(`Rooms must be between 1 and ${Math.min(room.quantity, 20)}`, 400)
    );
  }

  if (!Number.isInteger(guests) || guests < 1 || guests > maxParty) {
    return next(
      new AppError(
        `${rooms} × ${room.name} fits at most ${maxParty} guest(s)`,
        400
      )
    );
  }

  const message =
    typeof req.body?.message === "string" && req.body.message.trim()
      ? req.body.message.trim().slice(0, 1000)
      : null;

  // One open request per guest per stay and dates; stops accidental repeats.
  const duplicate = await Booking.exists({
    property: property._id,
    guest: req.user._id,
    status: { $in: ["requested", "confirmed"] },
    checkIn: { $lt: range.checkOut },
    checkOut: { $gt: range.checkIn },
  });

  if (duplicate) {
    return next(
      new AppError(
        "You already have a booking at this stay for overlapping dates",
        409
      )
    );
  }

  const confirmed = await findConfirmedOverlapping({
    propertyIds: [property._id],
    roomTypeId: room._id,
    checkIn: range.checkIn,
    checkOut: range.checkOut,
  });

  if (freeRoomsFor(room.quantity, confirmed, range.checkIn, range.checkOut) < rooms) {
    return next(
      new AppError(
        `Not enough ${room.name} rooms are free for those dates`,
        409
      )
    );
  }

  const booking = await Booking.create({
    property: property._id,
    owner: property.owner,
    guest: req.user._id,
    roomType: {
      id: room._id,
      name: room.name,
      nightlyPrice: room.nightlyPrice,
      maxGuests: room.maxGuests,
    },
    rooms,
    guests,
    checkIn: range.checkIn,
    checkOut: range.checkOut,
    nights: range.nights,
    totalPrice: room.nightlyPrice * range.nights * rooms,
    message,
  });

  await safeCreateNotification({
    user: property.owner,
    type: "booking_request",
    title: "New Booking Request",
    message: `${req.user.name} requested ${rooms} × ${room.name} at ${property.title}, ${dateText(range.checkIn)} to ${dateText(range.checkOut)} (${range.nights} night${range.nights === 1 ? "" : "s"}).`,
    resourceType: "booking",
    resourceId: booking._id,
  });

  const populated = await populateBooking(Booking.findById(booking._id));

  res.status(201).json({
    success: true,
    message: "Booking request sent",
    data: { booking: formatBooking(populated) },
  });
});

/*
|--------------------------------------------------------------------------
| Lists
| GET /api/bookings/mine       — the guest's trips
| GET /api/bookings/received   — bookings at the owner's stays
|--------------------------------------------------------------------------
*/

const listBookings = (field) =>
  asyncHandler(async (req, res, next) => {
    const filter = { [field]: req.user._id };

    if (req.query.status) {
      if (!Booking.BOOKING_STATUSES.includes(req.query.status)) {
        return next(new AppError("Invalid booking status", 400));
      }

      filter.status = req.query.status;
    }

    const bookings = await populateBooking(
      Booking.find(filter).sort({ checkIn: -1, createdAt: -1 }).limit(200)
    );

    res.status(200).json({
      success: true,
      data: {
        count: bookings.length,
        bookings: bookings.map(formatBooking),
      },
    });
  });

exports.getMyBookings = listBookings("guest");
exports.getReceivedBookings = listBookings("owner");

/*
|--------------------------------------------------------------------------
| Confirm (hotel)
| PATCH /api/bookings/:id/confirm
|--------------------------------------------------------------------------
|
| Runs in a transaction that also bumps the stay's bookingRevision, so two
| confirmations for the same stay can't both read "1 room free" and both
| succeed: MongoDB makes the second one retry and it then sees the first.
*/

exports.confirmBooking = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid booking ID", 400));
  }

  const session = await mongoose.startSession();
  let booking;

  try {
    await session.withTransaction(async () => {
      booking = await Booking.findOne({
        _id: req.params.id,
        owner: req.user._id,
      }).session(session);

      if (!booking) {
        throw new AppError("Booking not found", 404);
      }

      if (booking.status !== "requested") {
        throw new AppError("Only new requests can be confirmed", 400);
      }

      if (booking.checkIn < startOfGilgitToday()) {
        throw new AppError("The check-in date has already passed", 400);
      }

      const property = await Property.findOneAndUpdate(
        { _id: booking.property, isDeleted: { $ne: true } },
        { $inc: { bookingRevision: 1 } },
        // timestamps: false — a booking isn't an edit to the listing.
        { returnDocument: "after", session, timestamps: false }
      );

      const room = property?.roomTypes?.find(
        (roomType) => String(roomType._id) === String(booking.roomType.id)
      );

      if (!room) {
        throw new AppError("This room type no longer exists at the stay", 409);
      }

      const confirmed = await findConfirmedOverlapping(
        {
          propertyIds: [booking.property],
          roomTypeId: booking.roomType.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          excludeBookingId: booking._id,
        },
        session
      );

      if (freeRoomsFor(room.quantity, confirmed, booking.checkIn, booking.checkOut) < booking.rooms) {
        throw new AppError(
          "Not enough rooms are free for these dates any more. Decline this request or free up rooms first.",
          409
        );
      }

      booking.status = "confirmed";
      booking.respondedAt = new Date();
      booking.ownerResponse =
        typeof req.body?.message === "string" && req.body.message.trim()
          ? req.body.message.trim().slice(0, 500)
          : null;

      await booking.save({ session });
    });
  } finally {
    await session.endSession();
  }

  const populated = await populateBooking(Booking.findById(booking._id));

  await safeCreateNotification({
    user: booking.guest,
    type: "booking_update",
    title: "Booking Confirmed",
    message: `${populated.property?.title || "The hotel"} confirmed your stay from ${dateText(booking.checkIn)} to ${dateText(booking.checkOut)}. Total ${moneyText(booking.totalPrice)}, paid at the hotel.`,
    resourceType: "booking",
    resourceId: booking._id,
  });

  res.status(200).json({
    success: true,
    message: "Booking confirmed",
    data: { booking: formatBooking(populated) },
  });
});

/*
|--------------------------------------------------------------------------
| Decline (hotel)
| PATCH /api/bookings/:id/decline
|--------------------------------------------------------------------------
*/

exports.declineBooking = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid booking ID", 400));
  }

  const booking = await Booking.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, status: "requested" },
    {
      $set: {
        status: "declined",
        respondedAt: new Date(),
        ownerResponse:
          typeof req.body?.message === "string" && req.body.message.trim()
            ? req.body.message.trim().slice(0, 500)
            : null,
      },
    },
    { returnDocument: "after" }
  );

  if (!booking) {
    return next(new AppError("No open request found to decline", 404));
  }

  const populated = await populateBooking(Booking.findById(booking._id));

  await safeCreateNotification({
    user: booking.guest,
    type: "booking_update",
    title: "Booking Declined",
    message: `${populated.property?.title || "The hotel"} can't host your stay from ${dateText(booking.checkIn)}.${booking.ownerResponse ? ` “${booking.ownerResponse}”` : ""}`,
    resourceType: "booking",
    resourceId: booking._id,
  });

  res.status(200).json({
    success: true,
    message: "Booking declined",
    data: { booking: formatBooking(populated) },
  });
});

/*
|--------------------------------------------------------------------------
| Cancel (guest or hotel)
| PATCH /api/bookings/:id/cancel
|--------------------------------------------------------------------------
|
| Guest: a request any time; a confirmed stay until 24 hours before the
| hotel's check-in time. After that only the hotel can cancel.
| Hotel: a confirmed stay, with a reason (a request is declined instead).
*/

exports.cancelBooking = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid booking ID", 400));
  }

  const booking = await Booking.findOne({
    _id: req.params.id,
    $or: [{ guest: req.user._id }, { owner: req.user._id }],
  }).populate("property", "title checkInTime");

  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  const isGuest = String(booking.guest) === String(req.user._id);
  const reason =
    typeof req.body?.reason === "string" && req.body.reason.trim()
      ? req.body.reason.trim().slice(0, 500)
      : null;

  if (isGuest) {
    if (!["requested", "confirmed"].includes(booking.status)) {
      return next(new AppError("This booking can no longer be cancelled", 400));
    }

    if (booking.status === "confirmed") {
      const cutoff =
        checkInMoment(booking.checkIn, booking.property?.checkInTime).getTime() -
        CANCEL_CUTOFF_MS;

      if (Date.now() > cutoff) {
        return next(
          new AppError(
            "Confirmed stays can be cancelled until 24 hours before check-in. Please contact the hotel.",
            409
          )
        );
      }
    }
  } else {
    if (booking.status !== "confirmed") {
      return next(
        new AppError(
          booking.status === "requested"
            ? "Decline the request instead of cancelling it"
            : "This booking can no longer be cancelled",
          400
        )
      );
    }

    if (booking.checkOut <= startOfGilgitToday()) {
      return next(new AppError("This stay has already ended", 400));
    }

    if (!reason || reason.length < 5) {
      return next(new AppError("Tell the guest why the stay is cancelled", 400));
    }
  }

  // Conditional update: nothing changes if someone else acted first.
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, status: booking.status },
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date(),
        cancelledBy: isGuest ? "guest" : "owner",
        ...(isGuest ? {} : { ownerResponse: reason }),
      },
    },
    { returnDocument: "after" }
  );

  if (!updated) {
    return next(new AppError("This booking changed in the meantime. Refresh and try again.", 409));
  }

  const title = booking.property?.title || "the stay";

  await safeCreateNotification({
    user: isGuest ? booking.owner : booking.guest,
    type: isGuest ? "booking_request" : "booking_update",
    title: "Booking Cancelled",
    message: isGuest
      ? `${req.user.name} cancelled their ${booking.status === "requested" ? "request" : "stay"} at ${title} (${dateText(booking.checkIn)}).`
      : `${title} cancelled your stay from ${dateText(booking.checkIn)}. “${reason}”`,
    resourceType: "booking",
    resourceId: booking._id,
  });

  const populated = await populateBooking(Booking.findById(booking._id));

  res.status(200).json({
    success: true,
    message: "Booking cancelled",
    data: { booking: formatBooking(populated) },
  });
});

/*
|--------------------------------------------------------------------------
| Review a completed stay (guest)
| POST /api/bookings/:id/review
|--------------------------------------------------------------------------
*/

exports.reviewBooking = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid booking ID", 400));
  }

  const rating = Number(req.body?.rating);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return next(new AppError("Rating must be a whole number from 1 to 5", 400));
  }

  const comment =
    typeof req.body?.comment === "string" && req.body.comment.trim()
      ? req.body.comment.trim().slice(0, 1000)
      : null;

  const booking = await Booking.findOneAndUpdate(
    {
      _id: req.params.id,
      guest: req.user._id,
      status: "completed",
      "review.rating": null,
    },
    {
      $set: {
        "review.rating": rating,
        "review.comment": comment,
        "review.createdAt": new Date(),
      },
    },
    { returnDocument: "after" }
  ).populate("property", "title");

  if (!booking) {
    return next(
      new AppError("Only a completed stay you haven't reviewed yet can be reviewed", 400)
    );
  }

  await safeCreateNotification({
    user: booking.owner,
    type: "review",
    title: "New Stay Review",
    message: `${req.user.name} gave ${booking.property?.title || "your stay"} ${rating} star${rating === 1 ? "" : "s"}.`,
    resourceType: "booking",
    resourceId: booking._id,
  });

  const populated = await populateBooking(Booking.findById(booking._id));

  res.status(200).json({
    success: true,
    message: "Thanks for your review",
    data: { booking: formatBooking(populated) },
  });
});
