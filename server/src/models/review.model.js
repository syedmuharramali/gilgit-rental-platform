const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    tenancy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenancy",
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviewee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reviewerRole: {
      type: String,
      enum: ["owner", "renter"],
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| One review from each participant per tenancy
|--------------------------------------------------------------------------
*/

reviewSchema.index(
  {
    tenancy: 1,
    reviewer: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| Review lookup indexes
|--------------------------------------------------------------------------
*/

reviewSchema.index({
  property: 1,
  reviewerRole: 1,
  createdAt: -1,
});

reviewSchema.index({
  reviewee: 1,
  createdAt: -1,
});

const Review = mongoose.model(
  "Review",
  reviewSchema
);

module.exports = Review;