const mongoose = require("mongoose");

const rentalTermsSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    durationMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },

    monthlyRent: {
      type: Number,
      required: true,
      min: 0,
    },

    securityDeposit: {
      type: Number,
      required: true,
      min: 0,
    },

    occupants: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },

    status: {
      type: String,
      enum: [
        "proposed",
        "change_requested",
        "accepted",
        "cancelled",
      ],
      default: "proposed",
    },

    changeRequestMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    proposedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

rentalTermsSchema.index({ owner: 1, updatedAt: -1 });
rentalTermsSchema.index({ renter: 1, updatedAt: -1 });

module.exports = mongoose.model("RentalTerms", rentalTermsSchema);
