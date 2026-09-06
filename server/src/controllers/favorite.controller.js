const mongoose = require("mongoose");

const Favorite = require(
  "../models/favorite.model"
);

const Property = require(
  "../models/property.model"
);

const {
  getPublicFileViewUrl,
} = require(
  "../services/storage.service"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const favoritePropertySelect =
  "title slug monthlyRent securityDeposit propertyType furnishedStatus address listingStatus availableFrom bedrooms bathrooms maxOccupants images";

const formatPropertyImages = (
  images = []
) => {
  return [...images]
    .sort(
      (a, b) =>
        a.order - b.order
    )
    .map((image) => ({
      id: image._id,
      fileId: image.fileId,
      name: image.name,
      mimeType: image.mimeType,
      size: image.size,
      alt: image.alt,
      isCover: image.isCover,
      order: image.order,
      url:
        getPublicFileViewUrl(
          image.fileId
        ),
    }));
};

const formatFavorite = (
  favorite
) => {
  const result =
    favorite.toObject();

  if (favorite.property) {
    result.property.images =
      formatPropertyImages(
        favorite.property.images
      );
  }

  return result;
};

/*
|--------------------------------------------------------------------------
| Add property to favorites
| POST /api/favorites/:propertyId
|--------------------------------------------------------------------------
*/

exports.addFavorite =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.propertyId
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
            req.params.propertyId,

          listingStatus:
            "published",

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property not found or unavailable",
            404
          )
        );
      }

      const existingFavorite =
        await Favorite.findOne({
          user:
            req.user._id,

          property:
            property._id,
        });

      if (existingFavorite) {
        return next(
          new AppError(
            "Property is already saved",
            409
          )
        );
      }

      const favorite =
        await Favorite.create({
          user:
            req.user._id,

          property:
            property._id,
        });

      await favorite.populate({
        path: "property",

        select:
          favoritePropertySelect,
      });

      res.status(201).json({
        success: true,

        message:
          "Property saved successfully",

        data: {
          favorite:
            formatFavorite(
              favorite
            ),
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get logged-in user's favorites
| GET /api/favorites
|--------------------------------------------------------------------------
*/

exports.getMyFavorites =
  asyncHandler(
    async (req, res) => {
      const favorites =
        await Favorite.find({
          user:
            req.user._id,
        })
          .populate({
            path: "property",

            match: {
              listingStatus:
                "published",

              isDeleted: {
                $ne: true,
              },
            },

            select:
              favoritePropertySelect,
          })
          .sort({
            createdAt: -1,
          });

      /*
      |--------------------------------------------------------------------------
      | Hide saved references whose listing is no longer publicly available
      |--------------------------------------------------------------------------
      */

      const validFavorites =
        favorites
          .filter(
            (favorite) =>
              favorite.property
          )
          .map(
            formatFavorite
          );

      res.status(200).json({
        success: true,

        data: {
          count:
            validFavorites.length,

          favorites:
            validFavorites,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Check whether property is saved
| GET /api/favorites/:propertyId/check
|--------------------------------------------------------------------------
*/

exports.checkFavorite =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.propertyId
        )
      ) {
        return next(
          new AppError(
            "Invalid property ID",
            400
          )
        );
      }

      const favorite =
        await Favorite.findOne({
          user:
            req.user._id,

          property:
            req.params.propertyId,
        }).select("_id");

      res.status(200).json({
        success: true,

        data: {
          isSaved:
            Boolean(favorite),

          favoriteId:
            favorite?._id ||
            null,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Remove property from favorites
| DELETE /api/favorites/:propertyId
|--------------------------------------------------------------------------
*/

exports.removeFavorite =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.propertyId
        )
      ) {
        return next(
          new AppError(
            "Invalid property ID",
            400
          )
        );
      }

      const favorite =
        await Favorite.findOneAndDelete({
          user:
            req.user._id,

          property:
            req.params.propertyId,
        });

      if (!favorite) {
        return next(
          new AppError(
            "Saved property not found",
            404
          )
        );
      }

      res.status(200).json({
        success: true,

        message:
          "Property removed from saved properties",
      });
    }
  );
