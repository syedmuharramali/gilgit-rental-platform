const mongoose = require("mongoose");

const Tenancy = require("../models/tenancy.model");
const Property = require("../models/property.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  safeCreateNotification,
} = require("../services/notification.service");

const populateTenantSide = (query) =>
  query
    .populate(
      "property",
      "title slug propertyType address listingStatus"
    )
    .populate(
      "owner",
      "name email phone avatar"
    );

const populateOwnerSide = (query) =>
  query
    .populate(
      "property",
      "title slug propertyType address listingStatus"
    )
    .populate(
      "renter",
      "name email phone avatar"
    );

const getGilgitDateCutoff = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return new Date(
    Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      23,
      59,
      59,
      999
    )
  );
};

const activateDueTenancies = async (filter = {}) => {
  const now = new Date();
  const dateCutoff = getGilgitDateCutoff();

  const due = await Tenancy.find({
    ...filter,
    status: "upcoming",
    startDate: { $lte: dateCutoff },
  })
    .select("_id property owner renter")
    .lean();

  for (const dueTenancy of due) {
    const session = await mongoose.startSession();
    let transitioned = null;
    let propertyTitle = "your rental";

    try {
      await session.withTransaction(async () => {
        const tenancy = await Tenancy.findOne({
          _id: dueTenancy._id,
          status: "upcoming",
          startDate: { $lte: dateCutoff },
        }).session(session);

        if (!tenancy) return;

        const conflictingActiveTenancy = await Tenancy.exists({
          _id: { $ne: tenancy._id },
          property: tenancy.property,
          status: "active",
        }).session(session);

        if (conflictingActiveTenancy) return;

        const property = await Property.findById(
          tenancy.property
        ).session(session);

        tenancy.status = "active";
        tenancy.activatedAt = now;
        await tenancy.save({ session });

        if (property) {
          propertyTitle = property.title || propertyTitle;
          property.listingStatus = "rented";
          property.reservationStatus = "available";
          property.reservedAt = null;
          property.publishedAt = null;
          await property.save({ session });
        }

        transitioned = {
          _id: tenancy._id,
          owner: tenancy.owner,
          renter: tenancy.renter,
        };
      });
    } finally {
      await session.endSession();
    }

    if (transitioned) {
      await Promise.all([
        safeCreateNotification({
          user: transitioned.renter,
          type: "tenancy",
          title: "Rental Started",
          message: `Your rental for ${propertyTitle} is now active.`,
          resourceType: "tenancy",
          resourceId: transitioned._id,
        }),
        safeCreateNotification({
          user: transitioned.owner,
          type: "tenancy",
          title: "Rental Started",
          message: `The rental for ${propertyTitle} is now active.`,
          resourceType: "tenancy",
          resourceId: transitioned._id,
        }),
      ]);
    }
  }
};

exports.getMyTenancies = asyncHandler(async (req, res) => {
  await activateDueTenancies({ renter: req.user._id });

  const tenancies = await populateTenantSide(
    Tenancy.find({
      renter: req.user._id,
      status: { $ne: "pending_agreement" },
    })
  ).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      count: tenancies.length,
      tenancies,
    },
  });
});

exports.getOwnedTenancies = asyncHandler(async (req, res) => {
  await activateDueTenancies({ owner: req.user._id });

  const tenancies = await populateOwnerSide(
    Tenancy.find({
      owner: req.user._id,
      status: { $ne: "pending_agreement" },
    })
  ).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      count: tenancies.length,
      tenancies,
    },
  });
});

exports.getTenancyById = asyncHandler(async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid tenancy ID", 400));
  }

  await activateDueTenancies({ _id: req.params.id });

  const tenancy = await Tenancy.findById(req.params.id)
    .populate(
      "property",
      "title slug propertyType address listingStatus"
    )
    .populate(
      "renter",
      "name email phone avatar"
    )
    .populate(
      "owner",
      "name email phone avatar"
    )
    .populate("application");

  if (!tenancy) {
    return next(new AppError("Tenancy not found", 404));
  }

  const isOwner =
    tenancy.owner._id.toString() === req.user._id.toString();
  const isRenter =
    tenancy.renter._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isRenter && !isAdmin) {
    return next(
      new AppError(
        "You are not authorized to view this tenancy",
        403
      )
    );
  }

  if (tenancy.status === "pending_agreement" && !isAdmin) {
    return next(new AppError("Tenancy not found", 404));
  }

  res.status(200).json({
    success: true,
    data: { tenancy },
  });
});
