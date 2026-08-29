const mongoose = require("mongoose");

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

      message: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Application message cannot exceed 1000 characters",
        ],
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
        default: "pending",
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

/*
|--------------------------------------------------------------------------
| Prevent duplicate applications
|--------------------------------------------------------------------------
*/

applicationSchema.index(
  {
    property: 1,
    applicant: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| Applicant dashboard
|--------------------------------------------------------------------------
*/

applicationSchema.index({
  applicant: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Owner application inbox
|--------------------------------------------------------------------------
*/

applicationSchema.index({
  owner: 1,
  status: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Property applications
|--------------------------------------------------------------------------
*/

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