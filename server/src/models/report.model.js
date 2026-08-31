const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    targetType: {
      type: String,
      enum: ["property", "user"],
      required: true,
    },

    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      default: null,
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reason: {
      type: String,
      enum: [
        "fraud",
        "misleading_listing",
        "harassment",
        "inappropriate_content",
        "duplicate_listing",
        "safety_concern",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "under_review",
        "resolved",
        "dismissed",
      ],
      default: "pending",
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({
  reporter: 1,
  createdAt: -1,
});

reportSchema.index({
  status: 1,
  createdAt: -1,
});

reportSchema.index({
  property: 1,
  status: 1,
});

reportSchema.index({
  reportedUser: 1,
  status: 1,
});

const Report = mongoose.model(
  "Report",
  reportSchema
);

module.exports = Report;