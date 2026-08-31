const mongoose = require("mongoose");

const maintenanceRequestSchema =
  new mongoose.Schema(
    {
      tenancy: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Tenancy",
        required: true,
      },

      property: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Property",
        required: true,
      },

      owner: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      renter: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150,
      },

      description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1500,
      },

      category: {
        type: String,
        enum: [
          "electricity",
          "water",
          "heating",
          "plumbing",
          "appliance",
          "security",
          "structural",
          "internet",
          "other",
        ],
        default: "other",
      },

      priority: {
        type: String,
        enum: [
          "low",
          "medium",
          "high",
          "urgent",
        ],
        default: "medium",
      },

      status: {
        type: String,
        enum: [
          "pending",
          "in_progress",
          "resolved",
          "cancelled",
        ],
        default: "pending",
      },

      ownerResponse: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      resolvedAt: {
        type: Date,
        default: null,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

maintenanceRequestSchema.index({
  renter: 1,
  createdAt: -1,
});

maintenanceRequestSchema.index({
  owner: 1,
  status: 1,
  createdAt: -1,
});

maintenanceRequestSchema.index({
  tenancy: 1,
  status: 1,
});

const MaintenanceRequest =
  mongoose.model(
    "MaintenanceRequest",
    maintenanceRequestSchema
  );

module.exports =
  MaintenanceRequest;