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

const formatPropertyImages = (
  images
) => {
  return [...images]
    .sort(
      (a, b) =>
        a.order - b.order
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
};

const escapeRegex = (
  value = ""
) => {
  return value.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

const parseBooleanQuery = (
  value
) => {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return null;
};


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

      /*
      |--------------------------------------------------------------------------
      | Add public Appwrite URLs to property images
      |--------------------------------------------------------------------------
      */

      const formattedProperties =
        properties.map(
          (property) => {
            const result =
              property.toObject();

            result.images =
              formatPropertyImages(
                property.images
              );

            return result;
          }
        );

      res.status(200).json({
        success: true,

        data: {
          count:
            formattedProperties.length,

          properties:
            formattedProperties,
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
    async (req, res, next) => {
      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const page =
        Math.max(
          Number(req.query.page) ||
            1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit
            ) || 12,
            1
          ),
          50
        );

      /*
      |--------------------------------------------------------------------------
      | Base filter
      |--------------------------------------------------------------------------
      */

      const filter = {
        listingStatus:
          "published",

        isDeleted: {
          $ne: true,
        },
      };

      /*
      |--------------------------------------------------------------------------
      | Property type
      |--------------------------------------------------------------------------
      */

      if (
        req.query.propertyType
      ) {
        const allowedPropertyTypes = [
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

        if (
          !allowedPropertyTypes.includes(
            req.query.propertyType
          )
        ) {
          return next(
            new AppError(
              "Invalid property type",
              400
            )
          );
        }

        filter.propertyType =
          req.query.propertyType;
      }
      /*
      |--------------------------------------------------------------------------
      | Furnished status
      |--------------------------------------------------------------------------
      */

      if (
        req.query.furnishedStatus
      ) {
        const allowedFurnishedStatuses = [
          "furnished",
          "semi_furnished",
          "unfurnished",
        ];

        if (
          !allowedFurnishedStatuses.includes(
            req.query.furnishedStatus
          )
        ) {
          return next(
            new AppError(
              "Invalid furnished status",
              400
            )
          );
        }

        filter.furnishedStatus =
          req.query.furnishedStatus;
      }

      /*
      |--------------------------------------------------------------------------
      | Bedrooms
      |--------------------------------------------------------------------------
      */

      if (
        req.query.bedrooms !==
        undefined
      ) {
        const bedrooms =
          Number(
            req.query.bedrooms
          );

        if (
          Number.isNaN(
            bedrooms
          ) ||
          bedrooms < 0
        ) {
          return next(
            new AppError(
              "Bedrooms must be a valid non-negative number",
              400
            )
          );
        }

        filter.bedrooms =
          bedrooms;
      }

      /*
      |--------------------------------------------------------------------------
      | Bathrooms
      |--------------------------------------------------------------------------
      */

      if (
        req.query.bathrooms !==
        undefined
      ) {
        const bathrooms =
          Number(
            req.query.bathrooms
          );

        if (
          Number.isNaN(
            bathrooms
          ) ||
          bathrooms < 0
        ) {
          return next(
            new AppError(
              "Bathrooms must be a valid non-negative number",
              400
            )
          );
        }

        filter.bathrooms =
          bathrooms;
      }

      /*
      |--------------------------------------------------------------------------
      | Negotiable
      |--------------------------------------------------------------------------
      */

      if (
        req.query.negotiable !==
        undefined
      ) {
        const negotiable =
          parseBooleanQuery(
            req.query.negotiable
          );

        if (
          negotiable === null
        ) {
          return next(
            new AppError(
              "Negotiable must be true or false",
              400
            )
          );
        }

        filter.negotiable =
          negotiable;
      }

      /*
      |--------------------------------------------------------------------------
      | Rent range
      |--------------------------------------------------------------------------
      */

      const minRent =
        req.query.minRent !==
        undefined
          ? Number(
              req.query.minRent
            )
          : null;

      const maxRent =
        req.query.maxRent !==
        undefined
          ? Number(
              req.query.maxRent
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

      if (
        minRent !== null ||
        maxRent !== null
      ) {
        filter.monthlyRent =
          {};

        if (
          minRent !== null
        ) {
          filter.monthlyRent.$gte =
            minRent;
        }

        if (
          maxRent !== null
        ) {
          filter.monthlyRent.$lte =
            maxRent;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Area
      |--------------------------------------------------------------------------
      */

      if (req.query.area) {
        const area =
          escapeRegex(
            req.query.area.trim()
          );

        filter[
          "address.area"
        ] = {
          $regex: area,
          $options: "i",
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Availability date
      |--------------------------------------------------------------------------
      |
      | Example:
      | ?availableFrom=2026-09-05
      |
      | Returns properties available on or before that date.
      |
      */

      if (
        req.query.availableFrom
      ) {
        const availableDate =
          new Date(
            req.query.availableFrom
          );

        if (
          Number.isNaN(
            availableDate.getTime()
          )
        ) {
          return next(
            new AppError(
              "availableFrom must be a valid date",
              400
            )
          );
        }

        filter.availableFrom = {
          $lte:
            availableDate,
        };
      }

      /*
      |--------------------------------------------------------------------------
      | Amenities
      |--------------------------------------------------------------------------
      |
      | Example:
      | ?amenities=wifi,parking,heating
      |
      | Property must contain ALL requested amenities.
      |
      */

      if (
        req.query.amenities
      ) {
        const amenitySlugs =
          req.query.amenities
            .split(",")
            .map(
              (slug) =>
                slug
                  .trim()
                  .toLowerCase()
            )
            .filter(Boolean);

        if (
          amenitySlugs.length >
          0
        ) {
          const amenities =
            await Amenity.find({
              slug: {
                $in:
                  amenitySlugs,
              },

              isActive: true,
            }).select("_id slug");

          if (
            amenities.length !==
            amenitySlugs.length
          ) {
            return next(
              new AppError(
                "One or more amenity filters are invalid",
                400
              )
            );
          }

          filter.amenities = {
            $all:
              amenities.map(
                (amenity) =>
                  amenity._id
              ),
          };
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Heating
      |--------------------------------------------------------------------------
      */

      if (
        req.query.heating !==
        undefined
      ) {
        const heating =
          parseBooleanQuery(
            req.query.heating
          );

        if (heating === null) {
          return next(
            new AppError(
              "Heating must be true or false",
              400
            )
          );
        }

        filter[
          "livingInfo.heatingAvailable"
        ] = heating;
      }

      /*
      |--------------------------------------------------------------------------
      | Hot water
      |--------------------------------------------------------------------------
      */

      if (
        req.query.hotWater !==
        undefined
      ) {
        const hotWater =
          parseBooleanQuery(
            req.query.hotWater
          );

        if (
          hotWater === null
        ) {
          return next(
            new AppError(
              "Hot water must be true or false",
              400
            )
          );
        }

        filter[
          "livingInfo.hotWaterAvailable"
        ] = hotWater;
      }

      /*
      |--------------------------------------------------------------------------
      | Electricity backup
      |--------------------------------------------------------------------------
      */

      if (
        req.query.electricityBackup !==
        undefined
      ) {
        const electricityBackup =
          parseBooleanQuery(
            req.query
              .electricityBackup
          );

        if (
          electricityBackup ===
          null
        ) {
          return next(
            new AppError(
              "Electricity backup must be true or false",
              400
            )
          );
        }

        filter[
          "livingInfo.electricityBackup"
        ] =
          electricityBackup;
      }

      /*
      |--------------------------------------------------------------------------
      | Winter accessible
      |--------------------------------------------------------------------------
      */

      if (
        req.query.winterAccessible !==
        undefined
      ) {
        const winterAccessible =
          parseBooleanQuery(
            req.query
              .winterAccessible
          );

        if (
          winterAccessible ===
          null
        ) {
          return next(
            new AppError(
              "Winter accessible must be true or false",
              400
            )
          );
        }

        filter[
          "livingInfo.winterAccessible"
        ] =
          winterAccessible;
      }

      /*
      |--------------------------------------------------------------------------
      | Water availability
      |--------------------------------------------------------------------------
      */

      if (
        req.query.waterAvailability
      ) {
        const allowedValues = [
          "excellent",
          "good",
          "limited",
          "unreliable",
          "unknown",
        ];

        if (
          !allowedValues.includes(
            req.query
              .waterAvailability
          )
        ) {
          return next(
            new AppError(
              "Invalid water availability value",
              400
            )
          );
        }

        filter[
          "livingInfo.waterAvailability"
        ] =
          req.query
            .waterAvailability;
      }

      /*
      |--------------------------------------------------------------------------
      | Road access
      |--------------------------------------------------------------------------
      */

      if (
        req.query.roadAccess
      ) {
        const allowedValues = [
          "excellent",
          "good",
          "limited",
          "difficult",
          "unknown",
        ];

        if (
          !allowedValues.includes(
            req.query
              .roadAccess
          )
        ) {
          return next(
            new AppError(
              "Invalid road access value",
              400
            )
          );
        }

        filter[
          "livingInfo.roadAccess"
        ] =
          req.query.roadAccess;
      }

      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      */

      if (req.query.search) {
        const rawSearch =
          req.query.search.trim();

        if (rawSearch.length > 100) {
          return next(
            new AppError(
              "Search query cannot exceed 100 characters",
              400
            )
          );
        }

        const search =
          escapeRegex(rawSearch);

        if (search) {
          filter.$or = [
            {
              title: {
                $regex: search,
                $options: "i",
              },
            },

            {
              description: {
                $regex: search,
                $options: "i",
              },
            },

            {
              "address.area": {
                $regex: search,
                $options: "i",
              },
            },

            {
              "address.landmark": {
                $regex: search,
                $options: "i",
              },
            },
          ];
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Sorting
      |--------------------------------------------------------------------------
      */

      let sort = {
        publishedAt: -1,
      };

      switch (
        req.query.sort
      ) {
        case "rent_low":
          sort = {
            monthlyRent: 1,
          };
          break;

        case "rent_high":
          sort = {
            monthlyRent: -1,
          };
          break;

        case "oldest":
          sort = {
            publishedAt: 1,
          };
          break;

        case "newest":
          sort = {
            publishedAt: -1,
          };
          break;
      }

      /*
      |--------------------------------------------------------------------------
      | Database query
      |--------------------------------------------------------------------------
      */

      const [
        properties,
        total,
      ] =
        await Promise.all([
          Property.find(
            filter
          )
            .populate(
              "owner",
              "name avatar"
            )
            .populate(
              "amenities",
              "name slug category icon"
            )
            .sort(sort)
            .skip(
              (page - 1) *
                limit
            )
            .limit(limit),

          Property.countDocuments(
            filter
          ),
        ]);

      /*
      |--------------------------------------------------------------------------
      | Format response
      |--------------------------------------------------------------------------
      */

      const formattedProperties =
        properties.map(
          (property) => {
            const result =
              property.toObject();

            result.images =
              formatPropertyImages(
                property.images
              );

            delete result.reviewedBy;
            delete result.reviewedAt;
            delete result.submittedAt;
            delete result.rejectionReason;

            return result;
          }
        );

      res.status(200).json({
        success: true,

        data: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),

          count:
            formattedProperties.length,

          properties:
            formattedProperties,
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
      | Determine viewer permissions
      |--------------------------------------------------------------------------
      */

      const isOwner =
        req.user &&
        property.owner._id.toString() ===
          req.user._id.toString();

      const isAdmin =
        req.user?.role ===
        "admin";

      /*
      |--------------------------------------------------------------------------
      | Protect non-published listings
      |--------------------------------------------------------------------------
      |
      | Only the owner or an admin can view drafts,
      | pending-review, rejected, or inactive listings.
      |
      */

      if (
        property.listingStatus !==
          "published" &&
        !isOwner &&
        !isAdmin
      ) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Format response
      |--------------------------------------------------------------------------
      */

      const result =
        property.toObject();

      result.images =
        formatPropertyImages(
          property.images
        );

      /*
      |--------------------------------------------------------------------------
      | Hide internal review information from public viewers
      |--------------------------------------------------------------------------
      */

      if (
        !isOwner &&
        !isAdmin
      ) {
        delete result.reviewedBy;
        delete result.reviewedAt;
        delete result.submittedAt;
        delete result.rejectionReason;
      }

      res.status(200).json({
        success: true,

        data: {
          property: result,
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
  [
    "pending_review",
    "published",
    "rejected",
  ].includes(
    property.listingStatus
  )
) {
  property.listingStatus =
    "draft";

  property.submittedAt =
    null;

  property.reviewedAt =
    null;

  property.reviewedBy =
    null;

  property.rejectionReason =
    null;

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

  /*
|--------------------------------------------------------------------------
| Delete property image
| DELETE /api/properties/:id/images/:imageId
|--------------------------------------------------------------------------
*/

exports.deletePropertyImage =
  asyncHandler(
    async (req, res, next) => {
      const property =
        await Property.findOne({
          _id: req.params.id,
          owner: req.user._id,

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

      const image =
        property.images.id(
          req.params.imageId
        );

      if (!image) {
        return next(
          new AppError(
            "Property image not found",
            404
          )
        );
      }

      const fileId =
        image.fileId;

      const wasCover =
        image.isCover;

      /*
      |--------------------------------------------------------------------------
      | Remove image from property
      |--------------------------------------------------------------------------
      */

      property.images.pull(
        image._id
      );

      /*
      |--------------------------------------------------------------------------
      | Normalize order
      |--------------------------------------------------------------------------
      */

      property.images.sort(
        (a, b) =>
          a.order - b.order
      );

      property.images.forEach(
        (propertyImage, index) => {
          propertyImage.order =
            index;
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Replace cover if the deleted image was the cover
      |--------------------------------------------------------------------------
      */

      if (
        wasCover &&
        property.images.length > 0
      ) {
        property.images.forEach(
          (propertyImage) => {
            propertyImage.isCover =
              false;
          }
        );

        property.images[0].isCover =
          true;
      }

      /*
      |--------------------------------------------------------------------------
      | Editing published listing requires review again
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

      /*
      |--------------------------------------------------------------------------
      | Delete actual Appwrite file
      |--------------------------------------------------------------------------
      */

      try {
  await deleteFile(
    fileId
  );
} catch (error) {
  console.error(
    `Failed to delete Appwrite file ${fileId}: ${error.message}`
  );

  return res.status(200).json({
    success: true,

    message:
      "Property image removed, but storage cleanup could not be completed",

    data: {
      storageCleanupPending:
        true,
    },
  });
}

      const images =
        property.images.map(
          (propertyImage) => ({
            id:
              propertyImage._id,

            fileId:
              propertyImage.fileId,

            name:
              propertyImage.name,

            mimeType:
              propertyImage.mimeType,

            size:
              propertyImage.size,

            alt:
              propertyImage.alt,

            isCover:
              propertyImage.isCover,

            order:
              propertyImage.order,

            url:
              getPublicFileViewUrl(
                propertyImage.fileId
              ),
          })
        );

      res.status(200).json({
        success: true,

        message:
          "Property image deleted successfully",

        data: {
          images,
        },
      });
    }
  );

  /*
|--------------------------------------------------------------------------
| Set property cover image
| PATCH /api/properties/:id/images/:imageId/cover
|--------------------------------------------------------------------------
*/

exports.setPropertyCoverImage =
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

      const selectedImage =
        property.images.id(
          req.params.imageId
        );

      if (!selectedImage) {
        return next(
          new AppError(
            "Property image not found",
            404
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Ensure exactly one cover image
      |--------------------------------------------------------------------------
      */

      property.images.forEach(
        (image) => {
          image.isCover =
            image._id.toString() ===
            selectedImage._id.toString();
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Published listing returns to draft
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

      res.status(200).json({
        success: true,

        message:
          "Property cover image updated successfully",

        data: {
          images:
            formatPropertyImages(
              property.images
            ),
        },
      });
    }
  );

  /*
|--------------------------------------------------------------------------
| Reorder property images
| PATCH /api/properties/:id/images/reorder
|--------------------------------------------------------------------------
*/

exports.reorderPropertyImages =
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

      const imageIds =
        req.body?.imageIds;

      if (!Array.isArray(imageIds)) {
        return next(
          new AppError(
            "imageIds must be an array",
            400
          )
        );
      }

      if (
        imageIds.length !==
        property.images.length
      ) {
        return next(
          new AppError(
            "All property image IDs must be provided when reordering",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent duplicate IDs
      |--------------------------------------------------------------------------
      */

      const uniqueIds =
        new Set(
          imageIds.map(
            (id) =>
              id.toString()
          )
        );

      if (
        uniqueIds.size !==
        imageIds.length
      ) {
        return next(
          new AppError(
            "Duplicate image IDs are not allowed",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Ensure every ID belongs to this property
      |--------------------------------------------------------------------------
      */

      const existingIds =
        property.images.map(
          (image) =>
            image._id.toString()
        );

      const containsInvalidId =
        imageIds.some(
          (id) =>
            !existingIds.includes(
              id.toString()
            )
        );

      if (containsInvalidId) {
        return next(
          new AppError(
            "One or more image IDs do not belong to this property",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Update order
      |--------------------------------------------------------------------------
      */

      imageIds.forEach(
        (imageId, index) => {
          const image =
            property.images.id(
              imageId
            );

          image.order =
            index;
        }
      );

      property.images.sort(
        (a, b) =>
          a.order - b.order
      );

      /*
      |--------------------------------------------------------------------------
      | Published listing returns to draft
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

      res.status(200).json({
        success: true,

        message:
          "Property images reordered successfully",

        data: {
          images:
            formatPropertyImages(
              property.images
            ),
        },
      });
    }
  );

  /*
|--------------------------------------------------------------------------
| Submit property for admin review
| PATCH /api/properties/:id/submit
|--------------------------------------------------------------------------
*/

exports.submitPropertyForReview =
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
      | Only draft/rejected listings can be submitted
      |--------------------------------------------------------------------------
      */

      if (
        ![
          "draft",
          "rejected",
        ].includes(
          property.listingStatus
        )
      ) {
        return next(
          new AppError(
            "This property cannot be submitted in its current state",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Require enough property images
      |--------------------------------------------------------------------------
      */

      if (
        !property.images ||
        property.images.length < 3
      ) {
        return next(
          new AppError(
            "At least 3 property images are required before submission",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Ensure exactly one cover image
      |--------------------------------------------------------------------------
      */

      const coverImages =
        property.images.filter(
          (image) =>
            image.isCover
        );

      if (
        coverImages.length !== 1
      ) {
        return next(
          new AppError(
            "Exactly one property image must be selected as the cover",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Ensure amenities exist
      |--------------------------------------------------------------------------
      */

      if (
        !property.amenities ||
        property.amenities.length === 0
      ) {
        return next(
          new AppError(
            "Select at least one amenity before submitting the property",
            400
          )
        );
      }

      property.listingStatus =
        "pending_review";

      property.submittedAt =
        new Date();

      property.reviewedAt =
        null;

      property.reviewedBy =
        null;

      property.rejectionReason =
        null;

      property.publishedAt =
        null;

      await property.save();

      res.status(200).json({
        success: true,

        message:
          "Property submitted for review successfully",

        data: {
          property,
        },
      });
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