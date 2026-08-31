const mongoose = require("mongoose");

const roommateSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 80,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        maxlength: 150,
      },

      phone: {
        type: String,
        trim: true,
        maxlength: 30,
        default: null,
      },
    },
    {
      _id: true,
    }
  );

const applicationSchema =
  new mongoose.Schema(
    {
      property: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Property",
        required: true,
      },

      applicant: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      owner: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      applicationType: {
        type: String,
        enum: [
          "individual",
          "group",
        ],
        default:
          "individual",
      },

      roommates: {
        type: [
          roommateSchema,
        ],
        default: [],
      },

      message: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },

      preferredMoveInDate: {
        type: Date,
        default: null,
      },

      expectedStayMonths: {
        type: Number,
        min: 1,
        max: 120,
        default: null,
      },

      occupants: {
        type: Number,
        min: 1,
        max: 20,
        default: 1,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "accepted",
          "rejected",
          "withdrawn",
        ],
        default:
          "pending",
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      rejectionReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      withdrawnAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

applicationSchema.index(
  {
    property: 1,
    applicant: 1,
  },
  {
    unique: true,
  }
);

applicationSchema.index({
  applicant: 1,
  createdAt: -1,
});

applicationSchema.index({
  owner: 1,
  status: 1,
  createdAt: -1,
});

applicationSchema.index({
  property: 1,
  status: 1,
  createdAt: -1,
});

const Application =
  mongoose.model(
    "Application",
    applicationSchema
  );

module.exports =
  Application;