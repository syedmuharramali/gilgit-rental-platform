const Tenancy = require("../models/tenancy.model");
const asyncHandler = require("../utils/asyncHandler");
const {
  activateDueTenancies,
} = require("../services/tenancyActivation.service");

const populateRenterSide = (query) =>
  query
    .populate("property", "title slug propertyType address listingStatus")
    .populate("owner", "name email phone avatar");

const populateOwnerSide = (query) =>
  query
    .populate("property", "title slug propertyType address listingStatus")
    .populate("renter", "name email phone avatar");

// Read-only rental lists (used to pick a rental when writing a review).
// Agreement signing creates the rental; due "upcoming" rentals are
// activated here before listing them.
exports.getMyTenancies = asyncHandler(async (req, res) => {
  await activateDueTenancies({ renter: req.user._id });

  const tenancies = await populateRenterSide(
    Tenancy.find({
      renter: req.user._id,
      status: { $ne: "pending_agreement" },
    })
  ).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: { count: tenancies.length, tenancies },
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
    data: { count: tenancies.length, tenancies },
  });
});
