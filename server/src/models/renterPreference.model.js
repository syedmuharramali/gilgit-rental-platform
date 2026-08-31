const mongoose = require("mongoose");

const renterPreferenceSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },

      minRent: {
        type: Number,
        min: 0,
        default: null,
      },

      maxRent: {
        type: Number,
        min: 0,
        default: null,
      },

      propertyTypes: [
        {
          type: String,
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
      ],

      preferredAreas: [
        {
          type: String,
          trim: true,
          maxlength: 100,
        },
      ],

      furnishedStatuses: [
        {
          type: String,
          enum: [
            "furnished",
            "semi_furnished",
            "unfurnished",
          ],
        },
      ],

      minimumBedrooms: {
        type: Number,
        min: 0,
        max: 20,
        default: null,
      },

      amenities: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Amenity",
        },
      ],

      prioritizeWinterReadiness: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

const RenterPreference =
  mongoose.model(
    "RenterPreference",
    renterPreferenceSchema
  );

module.exports = RenterPreference;