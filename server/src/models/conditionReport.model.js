const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Condition item
|--------------------------------------------------------------------------
*/

const conditionItemSchema =
  new mongoose.Schema(
    {
      area: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      condition: {
        type: String,
        required: true,
        enum: [
          "excellent",
          "good",
          "fair",
          "poor",
          "damaged",
        ],
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },
    },
    {
      _id: true,
    }
  );

/*
|--------------------------------------------------------------------------
| Confirmation
|--------------------------------------------------------------------------
*/

const confirmationSchema =
  new mongoose.Schema(
    {
      confirmed: {
        type: Boolean,
        default: false,
      },

      confirmedAt: {
        type: Date,
        default: null,
      },
    },
    {
      _id: false,
    }
  );

/*
|--------------------------------------------------------------------------
| Evidence image
|--------------------------------------------------------------------------
*/

const evidenceSchema =
  new mongoose.Schema(
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

      uploadedBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

/*
|--------------------------------------------------------------------------
| Condition report
|--------------------------------------------------------------------------
*/

const conditionReportSchema =
  new mongoose.Schema(
    {
      tenancy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Tenancy",
        required: true,
      },

      property: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Property",
        required: true,
      },

      owner: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      renter: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      reportType: {
        type: String,
        enum: [
          "move_in",
          "move_out",
        ],
        required: true,
      },

      items: {
        type: [
          conditionItemSchema,
        ],

        validate: {
          validator(value) {
            return (
              Array.isArray(value) &&
              value.length > 0
            );
          },

          message:
            "At least one condition item is required",
        },
      },

      overallNotes: {
        type: String,
        trim: true,
        maxlength: 1500,
        default: null,
      },

      evidence: {
        type: [evidenceSchema],
        default: [],
      },

      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      ownerConfirmation: {
        type:
          confirmationSchema,
        default: () => ({}),
      },

      renterConfirmation: {
        type:
          confirmationSchema,
        default: () => ({}),
      },

      status: {
        type: String,
        enum: [
          "pending_confirmation",
          "confirmed",
        ],
        default:
          "pending_confirmation",
      },

      confirmedAt: {
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
| One move-in and one move-out report per tenancy
|--------------------------------------------------------------------------
*/

conditionReportSchema.index(
  {
    tenancy: 1,
    reportType: 1,
  },
  {
    unique: true,
  }
);

const ConditionReport =
  mongoose.model(
    "ConditionReport",
    conditionReportSchema
  );

module.exports =
  ConditionReport;