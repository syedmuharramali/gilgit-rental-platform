const mongoose = require("mongoose");
const slugify = require("slugify");

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [5, "Title must contain at least 5 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      required: [true, "Property description is required"],
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
      index: true,
    },

    monthlyRent: {
      type: Number,
      required: true,
      min: [0, "Monthly rent cannot be negative"],
      index: true,
    },

    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, "Security deposit cannot be negative"],
    },

    negotiable: {
      type: Boolean,
      default: false,
    },

    availableFrom: {
      type: Date,
      required: true,
      index: true,
    },

    minimumStayMonths: {
      type: Number,
      default: 1,
      min: [1, "Minimum stay must be at least 1 month"],
      max: [120, "Minimum stay cannot exceed 120 months"],
    },

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
        enum: ["sqft", "sqm", "kanal", "marla"],
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
      default: "unfurnished",
    },

    maxOccupants: {
      type: Number,
      min: 1,
      default: 1,
    },

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
        default: "Gilgit",
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
    amenities: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Amenity",
  },
],
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
      default: Date.now,
    },
  },
],
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
        default: "unknown",
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
        default: "unknown",
      },

      winterAccessible: {
        type: Boolean,
        default: true,
      },
    },

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
      index: true,
    },

    rejectionReason: {
      type: String,
      default: null,
      maxlength: 500,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

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
| Useful compound indexes
|--------------------------------------------------------------------------
*/

propertySchema.index({
  listingStatus: 1,
  propertyType: 1,
  monthlyRent: 1,
});

propertySchema.index({
  owner: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Generate unique slug before first save
|--------------------------------------------------------------------------
*/

propertySchema.pre("save", function () {
  if (
    this.isNew ||
    this.isModified("title")
  ) {
    const baseSlug = slugify(
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
});

const Property = mongoose.model(
  "Property",
  propertySchema
);

module.exports = Property;