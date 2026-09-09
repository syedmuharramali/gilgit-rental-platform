const mongoose = require("mongoose");

const Tenancy = require("../models/tenancy.model");
const Property = require("../models/property.model");
const ConditionReport = require("../models/conditionReport.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  safeCreateNotification,
} = require("../services/notification.service");

exports.endTenancy = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid tenancy ID", 400));
  }

  const reason = req.body?.reason?.trim() || null;

  if (reason && reason.length > 500) {
    return next(
      new AppError("End reason cannot exceed 500 characters", 400)
    );
  }

  const tenancy = await Tenancy.findOne({
    _id: req.params.id,
    owner: req.user._id,
    status: "active",
  });

  if (!tenancy) {
    return next(new AppError("Active tenancy not found", 404));
  }

  const moveOutReport = await ConditionReport.findOne({
    tenancy: tenancy._id,
    reportType: "move_out",
  });

  if (!moveOutReport) {
    return next(
      new AppError(
        "Create a move-out condition report before ending the tenancy",
        400
      )
    );
  }

  if (
    moveOutReport.status !== "confirmed" ||
    !moveOutReport.ownerConfirmation?.confirmed ||
    !moveOutReport.renterConfirmation?.confirmed
  ) {
    return next(
      new AppError(
        "Both parties must confirm the move-out condition report before the tenancy can end",
        400
      )
    );
  }

  const session = await mongoose.startSession();
  let endedTenancy;

  try {
    await session.withTransaction(async () => {
      endedTenancy = await Tenancy.findOne({
        _id: tenancy._id,
        owner: req.user._id,
        status: "active",
      }).session(session);

      if (!endedTenancy) {
        throw new AppError("Active tenancy not found", 404);
      }

      const property = await Property.findById(
        endedTenancy.property
      ).session(session);

      endedTenancy.status = "ended";
      endedTenancy.endedAt = new Date();
      endedTenancy.endReason = reason;
      await endedTenancy.save({ session });

      if (property) {
        property.listingStatus = "draft";
        property.reservationStatus = "available";
        property.reservedAt = null;
        property.publishedAt = null;
        property.submittedAt = null;
        property.reviewedAt = null;
        property.reviewedBy = null;
        property.rejectionReason = null;
        await property.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }

  await safeCreateNotification({
    user: endedTenancy.renter,
    type: "tenancy_ended",
    title: "Tenancy Ended",
    message: reason
      ? `Your tenancy has ended. Reason: ${reason}`
      : "Your tenancy has ended.",
    resourceType: "tenancy",
    resourceId: endedTenancy._id,
  });

  res.status(200).json({
    success: true,
    message: "Tenancy ended successfully",
    data: {
      tenancy: endedTenancy,
    },
  });
});
