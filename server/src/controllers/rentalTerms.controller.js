const mongoose = require("mongoose");

const Application = require("../models/application.model");
const Property = require("../models/property.model");
const RentalTerms = require("../models/rentalTerms.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { safeCreateNotification } = require("../services/notification.service");

const populateTerms = async (terms) => {
  await terms.populate([
    {
      path: "property",
      select: "title slug monthlyRent securityDeposit propertyType address listingStatus reservationStatus",
    },
    {
      path: "owner",
      select: "name email avatar",
    },
    {
      path: "renter",
      select: "name email avatar",
    },
    {
      path: "application",
      select: "status applicationType preferredMoveInDate expectedStayMonths occupants",
    },
  ]);

  return terms;
};

const parseTermsPayload = ({ body, application, property }) => {
  const startDateValue = body.startDate || application.preferredMoveInDate || property.availableFrom || new Date();
  const startDate = new Date(startDateValue);

  if (Number.isNaN(startDate.getTime())) {
    throw new AppError("Rental start date is invalid", 400);
  }

  const durationMonths = body.durationMonths !== undefined
    ? Number(body.durationMonths)
    : application.expectedStayMonths || property.minimumStayMonths;

  if (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120) {
    throw new AppError("Rental duration must be between 1 and 120 months", 400);
  }

  const monthlyRent = body.monthlyRent !== undefined
    ? Number(body.monthlyRent)
    : property.monthlyRent;

  if (Number.isNaN(monthlyRent) || monthlyRent < 0) {
    throw new AppError("Monthly rent must be a valid non-negative number", 400);
  }

  const securityDeposit = body.securityDeposit !== undefined
    ? Number(body.securityDeposit)
    : property.securityDeposit;

  if (Number.isNaN(securityDeposit) || securityDeposit < 0) {
    throw new AppError("Security deposit must be a valid non-negative number", 400);
  }

  const occupants = body.occupants !== undefined
    ? Number(body.occupants)
    : application.occupants;

  if (!Number.isInteger(occupants) || occupants < 1 || occupants > property.maxOccupants) {
    throw new AppError(`Occupants must be between 1 and ${property.maxOccupants}`, 400);
  }

  return {
    startDate,
    durationMonths,
    monthlyRent,
    securityDeposit,
    occupants,
  };
};

/*
|--------------------------------------------------------------------------
| Get rental terms for current user
| GET /api/rental-terms
|--------------------------------------------------------------------------
*/
exports.getMyRentalTerms = asyncHandler(async (req, res) => {
  const terms = await RentalTerms.find({
    $or: [
      { owner: req.user._id },
      { renter: req.user._id },
    ],
  })
    .populate("property", "title slug monthlyRent securityDeposit propertyType address listingStatus reservationStatus")
    .populate("owner", "name email avatar")
    .populate("renter", "name email avatar")
    .populate("application", "status applicationType preferredMoveInDate expectedStayMonths occupants")
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      count: terms.length,
      terms,
    },
  });
});

/*
|--------------------------------------------------------------------------
| Owner proposes or revises rental terms
| PUT /api/rental-terms/application/:applicationId
|--------------------------------------------------------------------------
*/
exports.proposeRentalTerms = asyncHandler(async (req, res, next) => {
  const { applicationId } = req.params;

  if (!mongoose.isValidObjectId(applicationId)) {
    return next(new AppError("Invalid application ID", 400));
  }

  const application = await Application.findOne({
    _id: applicationId,
    owner: req.user._id,
    status: "accepted",
  });

  if (!application) {
    return next(new AppError("Accepted application not found", 404));
  }

  const property = await Property.findOne({
    _id: application.property,
    owner: req.user._id,
    listingStatus: "published",
    reservationStatus: "reserved",
    isDeleted: { $ne: true },
  });

  if (!property) {
    return next(new AppError("Reserved property not found", 404));
  }

  const values = parseTermsPayload({
    body: req.body,
    application,
    property,
  });

  let terms = await RentalTerms.findOne({ application: application._id });

  if (terms?.status === "accepted") {
    return next(new AppError("Accepted rental terms cannot be changed", 409));
  }

  if (terms?.status === "cancelled") {
    return next(new AppError("Cancelled rental terms cannot be changed", 409));
  }

  if (!terms) {
    terms = await RentalTerms.create({
      application: application._id,
      property: property._id,
      owner: property.owner,
      renter: application.applicant,
      ...values,
      status: "proposed",
      proposedAt: new Date(),
    });
  } else {
    Object.assign(terms, values, {
      status: "proposed",
      proposedAt: new Date(),
      respondedAt: null,
      acceptedAt: null,
      changeRequestMessage: null,
    });

    await terms.save();
  }

  await populateTerms(terms);

  await safeCreateNotification({
    user: terms.renter._id,
    type: "application",
    title: "Rental Terms Proposed",
    message: `The owner sent rental terms for ${terms.property.title}. Review and accept them or request changes.`,
    resourceType: "application",
    resourceId: application._id,
  });

  res.status(200).json({
    success: true,
    message: "Rental terms sent to renter",
    data: { terms },
  });
});

/*
|--------------------------------------------------------------------------
| Renter accepts rental terms
| PATCH /api/rental-terms/:id/accept
|--------------------------------------------------------------------------
*/
exports.acceptRentalTerms = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid rental terms ID", 400));
  }

  const terms = await RentalTerms.findOne({
    _id: req.params.id,
    renter: req.user._id,
  });

  if (!terms) {
    return next(new AppError("Rental terms not found", 404));
  }

  if (terms.status !== "proposed") {
    return next(new AppError("Only proposed rental terms can be accepted", 400));
  }

  terms.status = "accepted";
  terms.respondedAt = new Date();
  terms.acceptedAt = new Date();
  terms.changeRequestMessage = null;
  await terms.save();

  await populateTerms(terms);

  await safeCreateNotification({
    user: terms.owner._id,
    type: "application",
    title: "Rental Terms Accepted",
    message: `${req.user.name} accepted the rental terms for ${terms.property.title}.`,
    resourceType: "application",
    resourceId: terms.application._id,
  });

  res.status(200).json({
    success: true,
    message: "Rental terms accepted",
    data: { terms },
  });
});

/*
|--------------------------------------------------------------------------
| Renter requests changes
| PATCH /api/rental-terms/:id/request-changes
|--------------------------------------------------------------------------
*/
exports.requestRentalTermChanges = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid rental terms ID", 400));
  }

  const message = typeof req.body.message === "string"
    ? req.body.message.trim()
    : "";

  if (message.length < 3 || message.length > 1000) {
    return next(new AppError("Please describe the requested changes in 3 to 1000 characters", 400));
  }

  const terms = await RentalTerms.findOne({
    _id: req.params.id,
    renter: req.user._id,
  });

  if (!terms) {
    return next(new AppError("Rental terms not found", 404));
  }

  if (terms.status !== "proposed") {
    return next(new AppError("Changes can only be requested for proposed rental terms", 400));
  }

  terms.status = "change_requested";
  terms.respondedAt = new Date();
  terms.changeRequestMessage = message;
  await terms.save();

  await populateTerms(terms);

  await safeCreateNotification({
    user: terms.owner._id,
    type: "application",
    title: "Rental Terms Need Changes",
    message: `${req.user.name} requested changes to the rental terms for ${terms.property.title}.`,
    resourceType: "application",
    resourceId: terms.application._id,
  });

  res.status(200).json({
    success: true,
    message: "Change request sent to owner",
    data: { terms },
  });
});
