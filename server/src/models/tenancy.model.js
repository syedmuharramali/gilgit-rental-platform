const mongoose = require("mongoose");

const tenancySchema =
  new mongoose.Schema(
    {
      application: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Application",
        required: true,
        unique: true,
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

      agreedMonthlyRent: {
        type: Number,
        required: true,
        min: 0,
      },

      securityDeposit: {
        type: Number,
        default: 0,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "active",
          "ended",
        ],
        default: "active",
      },

      endedAt: {
        type: Date,
        default: null,
      },

      endReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| Only one active tenancy per property
|--------------------------------------------------------------------------
*/

tenancySchema.index(
  {
    property: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      status: "active",
    },
  }
);

/*
|--------------------------------------------------------------------------
| Owner dashboard
|--------------------------------------------------------------------------
*/

tenancySchema.index({
  owner: 1,
  status: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Renter dashboard
|--------------------------------------------------------------------------
*/

tenancySchema.index({
  renter: 1,
  status: 1,
  createdAt: -1,
});

const Tenancy =
  mongoose.model(
    "Tenancy",
    tenancySchema
  );

module.exports = Tenancy;