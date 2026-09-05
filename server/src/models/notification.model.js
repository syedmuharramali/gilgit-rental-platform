const mongoose = require("mongoose");

const notificationSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      type: {
        type: String,

        enum: [
          "message",

          "application",
          "application_accepted",
          "application_rejected",
          "application_withdrawn",

          "viewing",
          "viewing_confirmed",
          "viewing_rejected",
          "viewing_cancelled",

          "tenancy",
          "tenancy_ended",

          "rent",

          "agreement",

          "condition_report",

          "maintenance",

          "review",

          "report",

          "system",
        ],

        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500,
      },

      resourceType: {
        type: String,

        enum: [
          "conversation",
          "application",
          "viewing",
          "tenancy",
          "rent_record",
          "property",
          "agreement",
          "condition_report",
          "maintenance_request",
          "report",
          "review",
          "system",
        ],

        default: "system",
      },

      resourceId: {
        type:
          mongoose.Schema.Types.ObjectId,
        default: null,
      },

      isRead: {
        type: Boolean,
        default: false,
      },

      readAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

notificationSchema.index({
  user: 1,
  isRead: 1,
  createdAt: -1,
});

notificationSchema.index({
  user: 1,
  createdAt: -1,
});

const Notification =
  mongoose.model(
    "Notification",
    notificationSchema
  );

module.exports =
  Notification;