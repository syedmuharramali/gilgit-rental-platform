const mongoose = require("mongoose");

const {
  uploadPublicImage,
  deleteFile,
  getPublicFileViewUrl,
} = require(
  "../services/storage.service"
);

const Property = require(
  "../models/property.model"
);

const Amenity = require(
  "../models/amenity.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

/*
|--------------------------------------------------------------------------
| Validate amenities
|--------------------------------------------------------------------------
*/

const validateAmenities = async (amenityIds) => {
  if (
    amenityIds === undefined ||
    amenityIds === null
  ) {
    return [];
  }

  if (!Array.isArray(amenityIds)) {
    throw new AppError(
      "Amenities must be an array",
      400
    );
  }

  if (amenityIds.length === 0) {
    return [];
  }

  const uniqueIds = [
    ...new Set(
      amenityIds.map((id) =>
        id.toString()
      )
    ),
  ];

  const hasInvalidId =
    uniqueIds.some(
      (id) =>
        !mongoose.isValidObjectId(id)
    );

  if (hasInvalidId) {
    throw new AppError(
      "One or more selected amenities have an invalid ID",
      400
    );
  }

  const amenities =
    await Amenity.find({
      _id: {
        $in: uniqueIds,
      },

      isActive: true,
    }).select("_id");

  if (
    amenities.length !==
    uniqueIds.length
  ) {
    throw new AppError(
      "One or more selected amenities are invalid or inactive",
      400
    );
  }

  return uniqueIds;
};

/*
|--------------------------------------------------------------------------
| Create property
| POST /api/properties
|--------------------------------------------------------------------------
*/

exports.createProperty = asyncHandler(
  async (req, res) => {
    const amenities =
      await validateAmenities(
        req.body.amenities
      );

    const property =
      await Property.create({
        owner: req.user._id,

        title: req.body.title,

        description:
          req.body.description,

        propertyType:
          req.body.propertyType,

        monthlyRent:
          req.body.monthlyRent,

        securityDeposit:
          req.body.securityDeposit,

        negotiable:
          req.body.negotiable,

        availableFrom:
          req.body.availableFrom,

        minimumStayMonths:
          req.body.minimumStayMonths,

        bedrooms:
          req.body.bedrooms,

        bathrooms:
          req.body.bathrooms,

        floor:
          req.body.floor,

        totalArea:
          req.body.totalArea,

        furnishedStatus:
          req.body.furnishedStatus,

        maxOccupants:
          req.body.maxOccupants,

        amenities,

        address:
          req.body.address,

        livingInfo:
          req.body.livingInfo,

        listingStatus:
          "draft",
      });

    await property.populate(
      "amenities",
      "name slug category icon"
    );

    res.status(201).json({
      success: true,

      message:
        "Property created successfully",

      data: {
        property,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Get logged-in owner's properties
| GET /api/properties/mine
|--------------------------------------------------------------------------
*/

exports.getMyProperties =
  asyncHandler(
    async (req, res) => {
      const properties =
        await Property.find({
          owner: req.user._id,

          isDeleted: {
            $ne: true,
          },
        })
          .populate(
            "amenities",
            "name slug category icon"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            properties.length,

          properties,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Public property listing
| GET /api/properties
|--------------------------------------------------------------------------
*/

exports.getPublishedProperties =
  asyncHandler(
    async (req, res) => {
      const properties =
        await Property.find({
          listingStatus:
            "published",

          isDeleted: {
            $ne: true,
          },
        })
          .populate(
            "owner",
            "name avatar"
          )
          .populate(
            "amenities",
            "name slug category icon"
          )
          .sort({
            publishedAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            properties.length,

          properties,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get single property
| GET /api/properties/:id
|--------------------------------------------------------------------------
*/

exports.getPropertyById =
  asyncHandler(
    async (req, res, next) => {
      const property =
        await Property.findOne({
          _id: req.params.id,

          isDeleted: {
            $ne: true,
          },
        })
          .populate(
            "owner",
            "name avatar"
          )
          .populate(
            "amenities",
            "name slug category icon"
          );

      if (!property) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Draft/private listings
      |--------------------------------------------------------------------------
      |
      | Only the owner or admin can view non-published properties.
      |
      */

      if (
        property.listingStatus !==
          "published" &&
        (
          !req.user ||
          (
            property.owner._id.toString() !==
              req.user._id.toString() &&
            req.user.role !==
              "admin"
          )
        )
      ) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      res.status(200).json({
        success: true,

        data: {
          property,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Update own property
| PATCH /api/properties/:id
|--------------------------------------------------------------------------
*/

exports.updateProperty =
  asyncHandler(
    async (req, res, next) => {
      const property =
        await Property.findOne({
          _id: req.params.id,

          owner:
            req.user._id,

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property not found or you do not own this property",
            404
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Protect against empty PATCH requests
      |--------------------------------------------------------------------------
      */

      const updates =
        req.body || {};

      if (
        Object.keys(updates)
          .length === 0
      ) {
        return next(
          new AppError(
            "No property updates were provided",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Amenities
      |--------------------------------------------------------------------------
      */

      if (
        updates.amenities !==
        undefined
      ) {
        property.amenities =
          await validateAmenities(
            updates.amenities
          );
      }

      /*
      |--------------------------------------------------------------------------
      | Allowed property fields
      |--------------------------------------------------------------------------
      */

      const allowedFields = [
        "title",
        "description",
        "propertyType",
        "monthlyRent",
        "securityDeposit",
        "negotiable",
        "availableFrom",
        "minimumStayMonths",
        "bedrooms",
        "bathrooms",
        "floor",
        "totalArea",
        "furnishedStatus",
        "maxOccupants",
        "amenities",
        "address",
        "livingInfo",
      ];

      allowedFields.forEach(
        (field) => {
          if (
            field !==
              "amenities" &&
            updates[field] !==
              undefined
          ) {
            property[field] =
              updates[field];
          }
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Editing a published property
      |--------------------------------------------------------------------------
      |
      | For now, editing a published listing returns it to draft.
      |
      */

      if (
        property.listingStatus ===
        "published"
      ) {
        property.listingStatus =
          "draft";

        property.publishedAt =
          null;
      }

      await property.save();

      await property.populate(
        "amenities",
        "name slug category icon"
      );

      res.status(200).json({
        success: true,

        message:
          "Property updated successfully",

        data: {
          property,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Soft delete property
| DELETE /api/properties/:id
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Upload property images
| POST /api/properties/:id/images
|--------------------------------------------------------------------------
*/

exports.uploadPropertyImages =
  asyncHandler(
    async (req, res, next) => {
      const property =
        await Property.findOne({
          _id: req.params.id,

          owner:
            req.user._id,

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property not found or you do not own this property",
            404
          )
        );
      }

      const files =
        req.files || [];

      if (files.length === 0) {
        return next(
          new AppError(
            "At least one property image is required",
            400
          )
        );
      }

      const currentCount =
        property.images.length;

      if (
        currentCount +
          files.length >
        10
      ) {
        return next(
          new AppError(
            "A property can have a maximum of 10 images",
            400
          )
        );
      }

      const uploadedFileIds =
        [];

      const newImages = [];

      try {
        let nextOrder =
          currentCount;

        for (
          const file of files
        ) {
          const upload =
            await uploadPublicImage(
              file,
              `property-${property._id}`,
              `properties/${property._id}`
            );

          uploadedFileIds.push(
            upload.fileId
          );

          newImages.push({
            fileId:
              upload.fileId,

            name:
              upload.name,

            mimeType:
              upload.mimeType,

            size:
              upload.sizeOriginal,

            alt:
              property.title,

            isCover:
              property.images.length ===
                0 &&
              newImages.length === 0,

            order:
              nextOrder++,
          });
        }

        property.images.push(
          ...newImages
        );

        /*
        |--------------------------------------------------------------------------
        | If a published property changes images,
        | return it to draft for review.
        |--------------------------------------------------------------------------
        */

        if (
          property.listingStatus ===
          "published"
        ) {
          property.listingStatus =
            "draft";

          property.publishedAt =
            null;
        }

        await property.save();

        const images =
          property.images
            .sort(
              (a, b) =>
                a.order -
                b.order
            )
            .map((image) => ({
              id:
                image._id,

              fileId:
                image.fileId,

              name:
                image.name,

              mimeType:
                image.mimeType,

              size:
                image.size,

              alt:
                image.alt,

              isCover:
                image.isCover,

              order:
                image.order,

              url:
                getPublicFileViewUrl(
                  image.fileId
                ),
            }));

        res.status(201).json({
          success: true,

          message:
            "Property images uploaded successfully",

          data: {
            images,
          },
        });
      } catch (error) {
        await Promise.allSettled(
          uploadedFileIds.map(
            (fileId) =>
              deleteFile(fileId)
          )
        );

        return next(error);
      }
    }
  );

exports.deleteProperty =
  asyncHandler(
    async (req, res, next) => {
      const property =
        await Property.findOne({
          _id: req.params.id,

          owner:
            req.user._id,

          isDeleted: {
            $ne: true,
          },
        }).select(
          "+isDeleted +deletedAt"
        );

      if (!property) {
        return next(
          new AppError(
            "Property not found or you do not own this property",
            404
          )
        );
      }

      property.isDeleted =
        true;

      property.deletedAt =
        new Date();

      property.listingStatus =
        "inactive";

      await property.save({
        validateBeforeSave:
          false,
      });

      res.status(200).json({
        success: true,

        message:
          "Property deleted successfully",
      });
    }
  );