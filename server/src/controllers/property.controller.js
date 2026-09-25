const mongoose = require("mongoose");
const { PROPERTY_TYPES, HOME_TYPES, SHOP_TYPES, STAY_TYPES, isLegacyPropertyType, isShopType, isStayType } = require("../data/propertyTypes");
const Booking = require("../models/booking.model");
const { startOfGilgitToday } = require("../utils/gilgitDate");
const { validateStayRange, maxRoomsBookedPerNight } = require("../utils/stayDates");
const { filterStaysWithRoom } = require("../services/booking.service");

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


const resetPropertyReviewState = (
  property
) => {
  const needsReset = [
    "pending_review",
    "published",
    "rejected",
  ].includes(
    property.listingStatus
  );

  if (!needsReset) {
    return;
  }

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
};


/*
|--------------------------------------------------------------------------
| Validate amenities
|--------------------------------------------------------------------------
*/

/*
| Room types arrive from the editor as plain objects. Keep only the known
| fields (and an existing _id, so bookings keep pointing at the same room).
*/
const cleanRoomTypes = (roomTypes) => {
  if (roomTypes === undefined) {
    return undefined;
  }

  if (!Array.isArray(roomTypes)) {
    throw new AppError("Room types must be a list", 400);
  }

  if (roomTypes.length > 20) {
    throw new AppError("A stay can have at most 20 room types", 400);
  }

  return roomTypes.map((room) => {
    if (!room || typeof room !== "object") {
      throw new AppError("Each room type needs a name, price, guests and rooms", 400);
    }

    const cleaned = {
      name: typeof room.name === "string" ? room.name.trim() : "",
      description:
        typeof room.description === "string" && room.description.trim()
          ? room.description.trim()
          : null,
      nightlyPrice: Number(room.nightlyPrice),
      maxGuests: Number(room.maxGuests),
      quantity: Number(room.quantity),
    };

    if (room._id && mongoose.isValidObjectId(room._id)) {
      cleaned._id = room._id;
    }

    return cleaned;
  });
};

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
        String(id ?? "")
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

        roomTypes:
          cleanRoomTypes(
            req.body.roomTypes
          ),

        checkInTime:
          req.body.checkInTime,

        checkOutTime:
          req.body.checkOutTime,

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
        const allowedPropertyTypes = PROPERTY_TYPES;

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
      | category=homes | shops narrows the list without naming a type. A
      | specific propertyType above always wins.
      */

      if (
        req.query.category &&
        !req.query.propertyType
      ) {
        if (
          req.query.category ===
          "shops"
        ) {
          filter.propertyType = {
            $in: SHOP_TYPES,
          };
        } else if (
          req.query.category ===
          "stays"
        ) {
          filter.propertyType = {
            $in: STAY_TYPES,
          };
        } else if (
          req.query.category ===
          "homes"
        ) {
          filter.propertyType = {
            $in: HOME_TYPES,
          };
        } else {
          return next(
            new AppError(
              "Category must be homes, shops or stays",
              400
            )
          );
        }
      }

      // A type in the URL wins over the category, as for the type filter.
      const isStaySearch =
        req.query.propertyType
          ? isStayType(
              req.query.propertyType
            )
          : req.query.category ===
            "stays";
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
        // Stays are priced per night; everything else per month.
        const priceField =
          isStaySearch
            ? "nightlyPriceFrom"
            : "monthlyRent";

        filter[priceField] =
          {};

        if (
          minRent !== null
        ) {
          filter[priceField].$gte =
            minRent;
        }

        if (
          maxRent !== null
        ) {
          filter[priceField].$lte =
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
            [isStaySearch ? "nightlyPriceFrom" : "monthlyRent"]: 1,
          };
          break;

        case "rent_high":
          sort = {
            [isStaySearch ? "nightlyPriceFrom" : "monthlyRent"]: -1,
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
      | Stays: only those with a free room for the dates and guests
      |--------------------------------------------------------------------------
      */

      if (
        isStaySearch &&
        (req.query.checkIn ||
          req.query.checkOut ||
          req.query.guests)
      ) {
        let checkIn = null;
        let checkOut = null;

        if (
          req.query.checkIn ||
          req.query.checkOut
        ) {
          const range =
            validateStayRange(
              req.query.checkIn,
              req.query.checkOut,
              startOfGilgitToday()
            );

          if (range.error) {
            return next(
              new AppError(
                range.error,
                400
              )
            );
          }

          checkIn = range.checkIn;
          checkOut = range.checkOut;
        }

        const guests =
          req.query.guests !==
          undefined
            ? Number(
                req.query.guests
              )
            : 1;

        if (
          !Number.isInteger(guests) ||
          guests < 1 ||
          guests > 100
        ) {
          return next(
            new AppError(
              "Guests must be between 1 and 100",
              400
            )
          );
        }

        // Every stay matching the other filters (a town has at most a few
        // hundred), then keep the ones with room for this party.
        const candidates =
          await Property.find(
            filter
          )
            .select(
              "_id roomTypes"
            )
            .lean();

        filter._id = {
          $in: await filterStaysWithRoom(
            candidates,
            {
              checkIn,
              checkOut,
              guests,
            }
          ),
        };
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
        Boolean(req.user) &&
        property.owner?._id?.toString() ===
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
      | Retired types stay on old listings but cannot be chosen again.
      */

      if (
        updates.propertyType !==
          undefined &&
        updates.propertyType !==
          property.propertyType &&
        !PROPERTY_TYPES.includes(
          updates.propertyType
        )
      ) {
        return next(
          new AppError(
            "Invalid property type",
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
        "checkInTime",
        "checkOutTime",
      ];

      /*
      | Bookings pin a stay down: it can't stop being a stay (its rooms would
      | be wiped) while guests are waiting or booked.
      */

      const openBookingFilter = {
        property: property._id,
        status: {
          $in: [
            "requested",
            "confirmed",
          ],
        },
      };

      if (
        updates.propertyType !== undefined &&
        isStayType(property.propertyType) !==
          isStayType(updates.propertyType) &&
        (await Booking.exists(openBookingFilter))
      ) {
        return next(
          new AppError(
            "This stay has open or confirmed bookings, so its type can't change to or from a hotel or guest house.",
            409
          )
        );
      }

      /*
      | Room types: a room type with upcoming bookings can't be deleted, or
      | those bookings would point at a room that no longer exists.
      */

      const nextRoomTypes =
        cleanRoomTypes(
          updates.roomTypes
        );

      if (
        nextRoomTypes !==
        undefined
      ) {
        const keptIds = new Set(
          nextRoomTypes
            .filter((room) => room._id)
            .map((room) => String(room._id))
        );

        const removedIds = (
          property.roomTypes || []
        )
          .map((room) => room._id)
          .filter(
            (roomId) =>
              !keptIds.has(
                String(roomId)
              )
          );

        if (
          removedIds.length > 0 &&
          (await Booking.exists({
            property: property._id,
            "roomType.id": {
              $in: removedIds,
            },
            status: {
              $in: [
                "requested",
                "confirmed",
              ],
            },
          }))
        ) {
          return next(
            new AppError(
              "A room type with upcoming bookings can't be removed. Answer or cancel those bookings first.",
              409
            )
          );
        }

        // Fewer rooms than are already booked on some night would overbook
        // those guests.
        const today = startOfGilgitToday();

        for (const nextRoom of nextRoomTypes) {
          const current = nextRoom._id
            ? (property.roomTypes || []).find(
                (room) =>
                  String(room._id) ===
                  String(nextRoom._id)
              )
            : null;

          if (
            !current ||
            !(Number(nextRoom.quantity) < current.quantity)
          ) {
            continue;
          }

          const future = await Booking.find({
            property: property._id,
            "roomType.id": current._id,
            status: "confirmed",
            checkOut: { $gt: today },
          })
            .select("rooms checkIn checkOut")
            .lean();

          if (future.length === 0) {
            continue;
          }

          const lastCheckOut = new Date(
            Math.max(
              ...future.map((booking) =>
                new Date(booking.checkOut).getTime()
              )
            )
          );

          const peak = maxRoomsBookedPerNight(
            future,
            today,
            lastCheckOut
          );

          if (Number(nextRoom.quantity) < peak) {
            return next(
              new AppError(
                `${current.name} has ${peak} rooms booked on its busiest upcoming night, so it can't be reduced below ${peak}.`,
                409
              )
            );
          }
        }

        // Reassigning an identical list would still mark the listing as
        // changed (and send it back to review), so only assign real edits.
        const roomKey = (rooms) =>
          JSON.stringify(
            rooms.map((room) => [
              room._id ? String(room._id) : null,
              room.name,
              room.description || null,
              Number(room.nightlyPrice),
              Number(room.maxGuests),
              Number(room.quantity),
            ])
          );

        if (
          roomKey(nextRoomTypes) !==
          roomKey(property.roomTypes || [])
        ) {
          property.roomTypes =
            nextRoomTypes;
        }
      }

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
      | Editing a published listing returns it to draft — but only when
      | something actually changed. Pressing Save with nothing edited used
      | to take a live listing offline for no reason.
      |
      */

      if (property.isModified()) {
        resetPropertyReviewState(
          property
        );
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
        | Image changes invalidate an existing review decision.
        | Reset pending/published/rejected listings to draft.
        |--------------------------------------------------------------------------
        */

        resetPropertyReviewState(
          property
        );

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
      | Image changes invalidate an existing review decision
      |--------------------------------------------------------------------------
      */

      resetPropertyReviewState(
        property
      );

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
      | Image changes invalidate an existing review decision
      |--------------------------------------------------------------------------
      */

      resetPropertyReviewState(
        property
      );

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
      | Image changes invalidate an existing review decision
      |--------------------------------------------------------------------------
      */

      resetPropertyReviewState(
        property
      );

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

      /*
      | A stay can't be booked without at least one room type.
      */

      if (
        isStayType(
          property.propertyType
        ) &&
        !(property.roomTypes?.length > 0)
      ) {
        return next(
          new AppError(
            "Add at least one room type with a nightly price before submitting",
            400
          )
        );
      }

      /*
      | Floor area is what a shopkeeper compares shops by.
      */

      if (
        isShopType(
          property.propertyType
        ) &&
        !(
          Number(
            property.totalArea
              ?.value
          ) > 0
        )
      ) {
        return next(
          new AppError(
            "Add the shop's floor area before submitting it for review",
            400
          )
        );
      }

      /*
      | "Private room" and "Shared room" were retired. A listing still using
      | one must pick a current type before it can go back to review.
      */

      if (
        isLegacyPropertyType(
          property.propertyType
        )
      ) {
        return next(
          new AppError(
            "This property type is no longer offered. Edit the listing and choose a new type before submitting.",
            400
          )
        );
      }

      /*
      | The editor requires a map pin, but listings created before it did
      | could still be submitted without one and then showed no map at all.
      */

      const { latitude, longitude } =
        property.address || {};

      if (
        latitude == null ||
        longitude == null ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude))
      ) {
        return next(
          new AppError(
            "Drop a pin on the map (Location step) before submitting the property",
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

      // A hotel with guests waiting or booked can't just vanish.
      if (
        await Booking.exists({
          property: property._id,
          status: {
            $in: [
              "requested",
              "confirmed",
            ],
          },
        })
      ) {
        return next(
          new AppError(
            "This stay has open or confirmed bookings. Decline or cancel them before deleting it.",
            409
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