const mongoose = require(
  "mongoose"
);

const Property = require(
  "../models/property.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

exports.requireMutableOwnedProperty =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid property ID",
            400
          )
        );
      }

      const property =
        await Property.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,

          isDeleted: {
            $ne: true,
          },
        }).select(
          "listingStatus"
        );

      if (!property) {
        return next(
          new AppError(
            "Property not found or you do not own this property",
            404
          )
        );
      }

      if (
        property.listingStatus ===
        "rented"
      ) {
        return next(
          new AppError(
            "This property cannot be modified while it has an active tenancy",
            409
          )
        );
      }

      next();
    }
  );