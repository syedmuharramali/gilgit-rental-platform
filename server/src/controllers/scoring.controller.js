const mongoose = require("mongoose");

const Property = require(
  "../models/property.model"
);

const RenterPreference =
  require(
    "../models/renterPreference.model"
  );

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  calculateLivingScore,
  calculateMatchScore,
} = require(
  "../services/propertyScoring.service"
);

const {
  getPublicFileViewUrl,
} = require(
  "../services/storage.service"
);

/*
|--------------------------------------------------------------------------
| Save / update preferences
|--------------------------------------------------------------------------
*/

exports.savePreferences =
  asyncHandler(
    async (req, res, next) => {
      const minRent =
        req.body.minRent !==
        undefined
          ? Number(
              req.body.minRent
            )
          : null;

      const maxRent =
        req.body.maxRent !==
        undefined
          ? Number(
              req.body.maxRent
            )
          : null;

      if (
        minRent !== null &&
        (
          Number.isNaN(
            minRent
          ) ||
          minRent < 0
        )
      ) {
        return next(
          new AppError(
            "Minimum rent must be a valid non-negative number",
            400
          )
        );
      }

      if (
        maxRent !== null &&
        (
          Number.isNaN(
            maxRent
          ) ||
          maxRent < 0
        )
      ) {
        return next(
          new AppError(
            "Maximum rent must be a valid non-negative number",
            400
          )
        );
      }

      if (
        minRent !== null &&
        maxRent !== null &&
        minRent > maxRent
      ) {
        return next(
          new AppError(
            "Minimum rent cannot be greater than maximum rent",
            400
          )
        );
      }

      const allowedTypes = [
        "hostel",
        "hostel_bed",
        "shared_room",
        "private_room",
        "apartment",
        "house",
        "upper_portion",
        "lower_portion",
        "studio",
      ];

      const allowedFurnished =
        [
          "furnished",
          "semi_furnished",
          "unfurnished",
        ];

      const propertyTypes =
        Array.isArray(
          req.body
            .propertyTypes
        )
          ? req.body
              .propertyTypes
          : [];

      const furnishedStatuses =
        Array.isArray(
          req.body
            .furnishedStatuses
        )
          ? req.body
              .furnishedStatuses
          : [];

      if (
        propertyTypes.some(
          (type) =>
            !allowedTypes.includes(
              type
            )
        )
      ) {
        return next(
          new AppError(
            "One or more property types are invalid",
            400
          )
        );
      }

      if (
        furnishedStatuses.some(
          (status) =>
            !allowedFurnished.includes(
              status
            )
        )
      ) {
        return next(
          new AppError(
            "One or more furnished statuses are invalid",
            400
          )
        );
      }

      const preferredAreas =
        Array.isArray(
          req.body
            .preferredAreas
        )
          ? req.body
              .preferredAreas
              .map((area) =>
                String(area)
                  .trim()
              )
              .filter(Boolean)
          : [];

      const amenities =
        Array.isArray(
          req.body.amenities
        )
          ? req.body.amenities
          : [];

      if (
        amenities.some(
          (id) =>
            !mongoose
              .isValidObjectId(
                id
              )
        )
      ) {
        return next(
          new AppError(
            "One or more amenity IDs are invalid",
            400
          )
        );
      }

      let minimumBedrooms =
        null;

      if (
        req.body
          .minimumBedrooms !==
        undefined &&
        req.body
          .minimumBedrooms !==
        null
      ) {
        minimumBedrooms =
          Number(
            req.body
              .minimumBedrooms
          );

        if (
          !Number.isInteger(
            minimumBedrooms
          ) ||
          minimumBedrooms < 0 ||
          minimumBedrooms > 20
        ) {
          return next(
            new AppError(
              "Minimum bedrooms must be between 0 and 20",
              400
            )
          );
        }
      }

      const preferences =
        await RenterPreference.findOneAndUpdate(
          {
            user:
              req.user._id,
          },
          {
            user:
              req.user._id,

            minRent,

            maxRent,

            propertyTypes,

            preferredAreas,

            furnishedStatuses,

            minimumBedrooms,

            amenities,

            prioritizeWinterReadiness:
              req.body
                .prioritizeWinterReadiness !==
              false,
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        ).populate(
          "amenities",
          "name slug category"
        );

      res.status(200).json({
        success: true,

        message:
          "Rental preferences saved successfully",

        data: {
          preferences,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get my preferences
|--------------------------------------------------------------------------
*/

exports.getMyPreferences =
  asyncHandler(
    async (req, res) => {
      const preferences =
        await RenterPreference.findOne({
          user:
            req.user._id,
        }).populate(
          "amenities",
          "name slug category"
        );

      res.status(200).json({
        success: true,

        data: {
          preferences,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Smart matches
|--------------------------------------------------------------------------
*/

exports.getSmartMatches =
  asyncHandler(
    async (req, res, next) => {
      const preferences =
        await RenterPreference.findOne({
          user:
            req.user._id,
        });

      if (!preferences) {
        return next(
          new AppError(
            "Save your rental preferences before requesting smart matches",
            400
          )
        );
      }

      const requestedLimit =
        Number(
          req.query.limit
        ) || 20;

      const limit =
        Math.min(
          Math.max(
            requestedLimit,
            1
          ),
          50
        );

      /*
      | Fetch a reasonable candidate
      | pool then rank in memory.
      */

      const properties =
        await Property.find({
          listingStatus:
            "published",

          isDeleted: {
            $ne: true,
          },
        })
          .populate(
            "amenities",
            "name slug category"
          )
          .sort({
            publishedAt: -1,
          })
          .limit(100);

      const matches =
        properties
          .map((property) => {
            const match =
              calculateMatchScore(
                property,
                preferences
              );

            const living =
              calculateLivingScore(
                property
              );

            const object =
              property.toObject();

            object.images =
              (
                object.images ||
                []
              ).map(
                (image) => ({
                  ...image,

                  url:
                    getPublicFileViewUrl(
                      image.fileId
                    ),
                })
              );

            return {
              property: object,

              matchScore:
                match.score,

              matchLabel:
                match.label,

              matchBreakdown:
                match.breakdown,

              gilgitLivingScore:
                living.score,

              gilgitLivingLabel:
                living.label,
            };
          })
          .sort(
            (a, b) =>
              b.matchScore -
              a.matchScore
          )
          .slice(
            0,
            limit
          );

      res.status(200).json({
        success: true,

        data: {
          count:
            matches.length,

          matches,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Public Gilgit Living Score
|--------------------------------------------------------------------------
*/

exports.getPropertyLivingScore =
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
            req.params
              .propertyId,

          isDeleted: {
            $ne: true,
          },
        }).select(
          "title slug livingInfo"
        );

      if (!property) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      const result =
        calculateLivingScore(
          property
        );

      res.status(200).json({
        success: true,

        data: {
          property: {
            id:
              property._id,

            title:
              property.title,

            slug:
              property.slug,
          },

          gilgitLivingScore:
            result.score,

          label:
            result.label,

          breakdown:
            result.breakdown,
        },
      });
    }
  );