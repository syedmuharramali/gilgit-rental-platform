const mongoose = require("mongoose");
const slugify = require("slugify");

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Amenity name is required"],
      trim: true,
      unique: true,
      maxlength: 80,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "utilities",
        "comfort",
        "security",
        "parking",
        "food",
        "study",
        "bathroom",
        "kitchen",
        "laundry",
        "other",
      ],
      default: "other",
    },

    icon: {
      type: String,
      default: null,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

amenitySchema.pre("validate", function () {
  if (this.name) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      trim: true,
    });
  }
});

const Amenity = mongoose.model(
  "Amenity",
  amenitySchema
);

module.exports = Amenity;