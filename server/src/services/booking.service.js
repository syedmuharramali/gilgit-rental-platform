const Booking = require("../models/booking.model");
const { safeCreateNotifications } = require("./notification.service");
const { getPublicFileViewUrl } = require("./storage.service");
const { startOfGilgitToday } = require("../utils/gilgitDate");
const { freeRoomsFor } = require("../utils/stayDates");

const ONE_HOUR_MS = 60 * 60 * 1000;

/*
|--------------------------------------------------------------------------
| Confirmed bookings overlapping a date range
|--------------------------------------------------------------------------
|
| Only *confirmed* bookings hold rooms. A request holds nothing until the
| hotel accepts it, so a flood of requests can't block a hotel's calendar.
*/

const findConfirmedOverlapping = (
  { propertyIds, roomTypeId, checkIn, checkOut, excludeBookingId },
  session = null
) => {
  const filter = {
    property: { $in: propertyIds },
    status: "confirmed",
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  };

  if (roomTypeId) filter["roomType.id"] = roomTypeId;
  if (excludeBookingId) filter._id = { $ne: excludeBookingId };

  const query = Booking.find(filter).select(
    "property roomType.id rooms checkIn checkOut"
  );

  return session ? query.session(session) : query.lean();
};

/*
| Free rooms per room type of one stay for [checkIn, checkOut).
| Returns [{ roomTypeId, free }].
*/
const getRoomAvailability = async (property, checkIn, checkOut, session = null) => {
  const bookings = await findConfirmedOverlapping(
    { propertyIds: [property._id], checkIn, checkOut },
    session
  );

  return (property.roomTypes || []).map((room) => ({
    roomTypeId: room._id,
    free: freeRoomsFor(
      room.quantity,
      bookings.filter(
        (booking) => String(booking.roomType.id) === String(room._id)
      ),
      checkIn,
      checkOut
    ),
  }));
};

/*
| For search: ids of stays (from `candidates`, each with roomTypes) that can
| host `guests` people for the dates. Without dates, only capacity counts.
| A stay qualifies if one room type has enough free rooms to fit everyone.
*/
const filterStaysWithRoom = async (candidates, { checkIn, checkOut, guests }) => {
  const wanted = Math.max(1, Number(guests) || 1);

  const bookings =
    checkIn && checkOut
      ? await findConfirmedOverlapping({
          propertyIds: candidates.map((stay) => stay._id),
          checkIn,
          checkOut,
        })
      : [];

  return candidates
    .filter((stay) =>
      (stay.roomTypes || []).some((room) => {
        const free =
          checkIn && checkOut
            ? freeRoomsFor(
                room.quantity,
                bookings.filter(
                  (booking) =>
                    String(booking.property) === String(stay._id) &&
                    String(booking.roomType.id) === String(room._id)
                ),
                checkIn,
                checkOut
              )
            : room.quantity;

        return free >= 1 && free * room.maxGuests >= wanted;
      })
    )
    .map((stay) => stay._id);
};

/*
|--------------------------------------------------------------------------
| Shape a booking for the API (property cover image with a real URL)
|--------------------------------------------------------------------------
*/

const formatBooking = (booking) => {
  const result = typeof booking.toObject === "function" ? booking.toObject() : { ...booking };
  const property = result.property;

  if (property && typeof property === "object" && Array.isArray(property.images)) {
    const cover =
      property.images.find((image) => image.isCover) || property.images[0];

    result.property = {
      ...property,
      images: undefined,
      coverImageUrl: cover?.fileId ? getPublicFileViewUrl(cover.fileId) : null,
    };
  }

  return result;
};

const BOOKING_PROPERTY_FIELDS =
  "title slug propertyType address.area address.city checkInTime checkOutTime images";

/*
|--------------------------------------------------------------------------
| Hourly sweep
|--------------------------------------------------------------------------
|
| - A request nobody answered expires once its check-in date has passed.
| - A confirmed stay is completed once its check-out date has arrived, and
|   the guest is invited to review it.
*/

const sweepBookings = async (now = new Date()) => {
  const today = startOfGilgitToday(now);

  const toExpire = await Booking.find({
    status: "requested",
    checkIn: { $lt: today },
  })
    .select("_id guest property")
    .populate("property", "title")
    .lean();

  if (toExpire.length) {
    await Booking.updateMany(
      { _id: { $in: toExpire.map((b) => b._id) }, status: "requested" },
      { $set: { status: "expired", respondedAt: now } }
    );

    await safeCreateNotifications(
      toExpire.map((b) => ({
        user: b.guest,
        type: "booking_update",
        title: "Booking Request Expired",
        message: `${b.property?.title || "The hotel"} didn't answer your request before the check-in date.`,
        resourceType: "booking",
        resourceId: b._id,
      }))
    );
  }

  const toComplete = await Booking.find({
    status: "confirmed",
    checkOut: { $lte: today },
  })
    .select("_id guest property")
    .populate("property", "title")
    .lean();

  if (toComplete.length) {
    await Booking.updateMany(
      { _id: { $in: toComplete.map((b) => b._id) }, status: "confirmed" },
      { $set: { status: "completed", completedAt: now } }
    );

    await safeCreateNotifications(
      toComplete.map((b) => ({
        user: b.guest,
        type: "booking_update",
        title: "How Was Your Stay?",
        message: `Your stay at ${b.property?.title || "the hotel"} is complete. You can now leave a review.`,
        resourceType: "booking",
        resourceId: b._id,
      }))
    );
  }

  return { expired: toExpire.length, completed: toComplete.length };
};

let sweepRunning = false;

const runBookingSweep = async () => {
  if (sweepRunning) return;
  sweepRunning = true;

  try {
    const { expired, completed } = await sweepBookings();

    if (expired || completed) {
      console.log(`Bookings: ${expired} expired, ${completed} completed`);
    }
  } catch (error) {
    console.error("[Booking Sweep Error]", error?.message);
  } finally {
    sweepRunning = false;
  }
};

const startBookingSchedule = (intervalMs = ONE_HOUR_MS) => {
  runBookingSweep();
  const timer = setInterval(runBookingSweep, intervalMs);
  timer.unref();
  return timer;
};

module.exports = {
  BOOKING_PROPERTY_FIELDS,
  findConfirmedOverlapping,
  getRoomAvailability,
  filterStaysWithRoom,
  formatBooking,
  sweepBookings,
  startBookingSchedule,
};
