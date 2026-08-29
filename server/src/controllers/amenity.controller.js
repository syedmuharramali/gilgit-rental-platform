const Amenity = require(
  "../models/amenity.model"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

/*
|--------------------------------------------------------------------------
| Get active amenities
| GET /api/amenities
|--------------------------------------------------------------------------
*/

exports.getAmenities = asyncHandler(
  async (req, res) => {
    const amenities =
      await Amenity.find({
        isActive: true,
      }).sort({
        category: 1,
        name: 1,
      });

    res.status(200).json({
      success: true,

      data: {
        count: amenities.length,
        amenities,
      },
    });
  }
);