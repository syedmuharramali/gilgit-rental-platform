const Amenity = require(
  "../models/amenity.model"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  ensureDefaultAmenities,
} = require(
  "../services/amenitySeed.service"
);

const findActiveAmenities = () =>
  Amenity.find({
    isActive: true,
  }).sort({
    category: 1,
    name: 1,
  });

/*
|--------------------------------------------------------------------------
| Get active amenities
| GET /api/amenities
|--------------------------------------------------------------------------
|
| Self-heals an empty catalogue so the property editor never shows
| an empty amenity step.
|
*/

exports.getAmenities = asyncHandler(
  async (req, res) => {
    let amenities =
      await findActiveAmenities();

    if (amenities.length === 0) {
      await ensureDefaultAmenities();

      amenities =
        await findActiveAmenities();
    }

    res.status(200).json({
      success: true,

      data: {
        count: amenities.length,
        amenities,
      },
    });
  }
);
