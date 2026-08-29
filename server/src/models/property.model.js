const mongoose = require("mongoose");
const slugify = require("slugify");

/*
|--------------------------------------------------------------------------
| Property schema
|--------------------------------------------------------------------------
*/

const propertySchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Owner
      |--------------------------------------------------------------------------
      */

      owner: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Basic information
      |--------------------------------------------------------------------------
      */

      title: {
        type: String,

        required: [
          true,
          "Property title is required",
        ],

        trim: true,

        minlength: [
          5,
          "Title must contain at least 5 characters",
        ],

        maxlength: [
          120,
          "Title cannot exceed 120 characters",
        ],
      },

      slug: {
        type: String,

        unique: true,
      },

      description: {
        type: String,

        required: [
          true,
          "Property description is required",
        ],

        trim: true,

        minlength: [
          20,
          "Description must contain at least 20 characters",
        ],

        maxlength: [
          3000,
          "Description cannot exceed 3000 characters",
        ],
      },

      propertyType: {
        type: String,

        required: true,

        enum: [
          "hostel",
          "hostel_bed",
          "shared_room",
          "private_room",
          "apartment",
          "house",
          "upper_portion",
          "lower_portion",
          "studio",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Pricing
      |--------------------------------------------------------------------------
      */

      monthlyRent: {
        type: Number,

        required: true,

        min: [
          0,
          "Monthly rent cannot be negative",
        ],
      },

      securityDeposit: {
        type: Number,

        default: 0,

        min: [
          0,
          "Security deposit cannot be negative",
        ],
      },

      negotiable: {
        type: Boolean,

        default: false,
      },

      /*
      |--------------------------------------------------------------------------
      | Availability
      |--------------------------------------------------------------------------
      */

      availableFrom: {
        type: Date,

        required: true,
      },

      minimumStayMonths: {
        type: Number,

        default: 1,

        min: [
          1,
          "Minimum stay must be at least 1 month",
        ],

        max: [
          120,
          "Minimum stay cannot exceed 120 months",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Property details
      |--------------------------------------------------------------------------
      */

      bedrooms: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,
      },

      bathrooms: {
        type: Number,

        default: 0,

        min: 0,

        max: 100,
      },

      floor: {
        type: Number,

        default: null,
      },

      totalArea: {
        value: {
          type: Number,

          min: 0,

          default: null,
        },

        unit: {
          type: String,

          enum: [
            "sqft",
            "sqm",
            "kanal",
            "marla",
          ],

          default: "sqft",
        },
      },

      furnishedStatus: {
        type: String,

        enum: [
          "furnished",
          "semi_furnished",
          "unfurnished",
        ],

        default:
          "unfurnished",
      },

      maxOccupants: {
        type: Number,

        min: 1,

        default: 1,
      },

      /*
      |--------------------------------------------------------------------------
      | Address
      |--------------------------------------------------------------------------
      */

      address: {
        area: {
          type: String,

          required: true,

          trim: true,
        },

        street: {
          type: String,

          trim: true,

          default: null,
        },

        city: {
          type: String,

          required: true,

          trim: true,

          default:
            "Gilgit",
        },

        landmark: {
          type: String,

          trim: true,

          default: null,
        },

        latitude: {
          type: Number,

          min: -90,

          max: 90,

          default: null,
        },

        longitude: {
          type: Number,

          min: -180,

          max: 180,

          default: null,
        },
      },

      /*
      |--------------------------------------------------------------------------
      | Amenities
      |--------------------------------------------------------------------------
      */

      amenities: [
        {
          type:
            mongoose.Schema.Types
              .ObjectId,

          ref: "Amenity",
        },
      ],

      /*
      |--------------------------------------------------------------------------
      | Property images
      |--------------------------------------------------------------------------
      */

      images: [
        {
          fileId: {
            type: String,

            required: true,
          },

          name: {
            type: String,

            required: true,
          },

          mimeType: {
            type: String,

            required: true,
          },

          size: {
            type: Number,

            required: true,
          },

          alt: {
            type: String,

            trim: true,

            default: "",
          },

          isCover: {
            type: Boolean,

            default: false,
          },

          order: {
            type: Number,

            default: 0,
          },

          uploadedAt: {
            type: Date,

            default:
              Date.now,
          },
        },
      ],

      /*
      |--------------------------------------------------------------------------
      | Gilgit living information
      |--------------------------------------------------------------------------
      */

      livingInfo: {
        heatingAvailable: {
          type: Boolean,

          default: false,
        },

        hotWaterAvailable: {
          type: Boolean,

          default: false,
        },

        electricityBackup: {
          type: Boolean,

          default: false,
        },

        waterAvailability: {
          type: String,

          enum: [
            "excellent",
            "good",
            "limited",
            "unreliable",
            "unknown",
          ],

          default:
            "unknown",
        },

        roadAccess: {
          type: String,

          enum: [
            "excellent",
            "good",
            "limited",
            "difficult",
            "unknown",
          ],

          default:
            "unknown",
        },

        winterAccessible: {
          type: Boolean,

          default: true,
        },
      },

      /*
      |--------------------------------------------------------------------------
      | Listing lifecycle
      |--------------------------------------------------------------------------
      */

      listingStatus: {
        type: String,

        enum: [
          "draft",
          "pending_review",
          "published",
          "rejected",
          "inactive",
          "rented",
        ],

        default: "draft",
      },

      /*
      |--------------------------------------------------------------------------
      | Review information
      |--------------------------------------------------------------------------
      */

      submittedAt: {
        type: Date,

        default: null,
      },

      reviewedAt: {
        type: Date,

        default: null,
      },

      reviewedBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        default: null,
      },

      rejectionReason: {
        type: String,

        default: null,

        maxlength: 500,
      },

      adminNotes: {
        type: String,

        maxlength: 1000,

        default: null,

        select: false,
      },

      /*
      |--------------------------------------------------------------------------
      | Publishing
      |--------------------------------------------------------------------------
      */

      publishedAt: {
        type: Date,

        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | Soft deletion
      |--------------------------------------------------------------------------
      */

      isDeleted: {
        type: Boolean,

        default: false,

        select: false,
      },

      deletedAt: {
        type: Date,

        default: null,

        select: false,
      },
    },

    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| Database indexes
|--------------------------------------------------------------------------
|
| These indexes support the queries we are currently using:
|
| - public listings
| - rent filtering
| - property type filtering
| - furnished filtering
| - area filtering
| - availability filtering
| - amenity filtering
| - owner dashboard
| - admin review queue
|
*/

/*
|--------------------------------------------------------------------------
| Public listing / newest properties
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  isDeleted: 1,
  publishedAt: -1,
});

/*
|--------------------------------------------------------------------------
| Rent filtering and sorting
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  isDeleted: 1,
  monthlyRent: 1,
});

/*
|--------------------------------------------------------------------------
| Property type filtering
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  isDeleted: 1,
  propertyType: 1,
});

/*
|--------------------------------------------------------------------------
| Furnished status filtering
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  isDeleted: 1,
  furnishedStatus: 1,
});

/*
|--------------------------------------------------------------------------
| Area filtering
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  isDeleted: 1,
  "address.area": 1,
});

/*
|--------------------------------------------------------------------------
| Availability filtering
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  isDeleted: 1,
  availableFrom: 1,
});

/*
|--------------------------------------------------------------------------
| Amenity filtering
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  isDeleted: 1,
  amenities: 1,
});

/*
|--------------------------------------------------------------------------
| Owner dashboard
|--------------------------------------------------------------------------
*/

propertySchema.index({
  owner: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Admin property review queue
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  submittedAt: 1,
});

/*
|--------------------------------------------------------------------------
| Generate unique slug
|--------------------------------------------------------------------------
*/

propertySchema.pre(
  "save",

  function () {
    if (
      this.isNew ||
      this.isModified(
        "title"
      )
    ) {
      const baseSlug =
        slugify(
          this.title,
          {
            lower: true,

            strict: true,

            trim: true,
          }
        );

      const uniquePart =
        this._id
          .toString()
          .slice(-6);

      this.slug =
        `${baseSlug}-${uniquePart}`;
    }
  }
);

/*
|--------------------------------------------------------------------------
| Model
|--------------------------------------------------------------------------
*/

const Property =
  mongoose.model(
    "Property",
    propertySchema
  );

module.exports =
  Property;