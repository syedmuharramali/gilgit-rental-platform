const Tenancy = require("../models/tenancy.model");
const asyncHandler = require("../utils/asyncHandler");

const populateRenterSide = (query) =>
  query
    .populate("property", "title slug propertyType address listingStatus")
    .populate("owner", "name email phone avatar");

const populateOwnerSide = (query) =>
  query
    .populate("property", "title slug propertyType address listingStatus")
    .populate("renter", "name email phone avatar");

// These read-only endpoints support property reviews attached to historic
// completed rentals. Agreement creation and completion own tenancy state.
exports.getMyTenancies = asyncHandler(async (req, res) => {
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
