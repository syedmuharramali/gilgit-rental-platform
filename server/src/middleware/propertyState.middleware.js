const mongoose = require(
  "mongoose"
);

const Property = require(
  "../models/property.model"
);

const Application = require(
  "../models/application.model"
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
          "listingStatus reservationStatus"
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

      /*
      |--------------------------------------------------------------------------
      | Reserved listings are locked too
      |--------------------------------------------------------------------------
      |
      | Editing a listing sends it back to draft. After an application has been
      | accepted that would break the rental terms and agreement steps (they
      | require a published listing), and it would let the owner change the
      | rent the renter applied for.
      |--------------------------------------------------------------------------
      */

      const hasAcceptedApplication =
        property.reservationStatus ===
          "reserved" ||
        (await Application.exists({
          property: property._id,
          status: "accepted",
        }));

      if (hasAcceptedApplication) {
        return next(
          new AppError(
            "This property cannot be modified after an application has been accepted",
            409
          )
        );
      }

      next();
    }
  );