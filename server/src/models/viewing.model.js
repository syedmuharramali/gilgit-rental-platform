const mongoose = require("mongoose");

const viewingSchema =
  new mongoose.Schema(
    {
      /*
      |--------------------------------------------------------------------------
      | Property
      |--------------------------------------------------------------------------
      */

      property: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "Property",

        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Renter requesting the viewing
      |--------------------------------------------------------------------------
      */

      renter: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Property owner
      |--------------------------------------------------------------------------
      */

      owner: {
        type:
          mongoose.Schema.Types
            .ObjectId,

        ref: "User",

        required: true,
      },

      /*
      |--------------------------------------------------------------------------
      | Requested viewing date/time
      |--------------------------------------------------------------------------
      */

      requestedDateTime: {
        type: Date,

        required: [
          true,
          "Viewing date and time are required",
        ],
      },

      /*
      |--------------------------------------------------------------------------
      | Optional renter message
      |--------------------------------------------------------------------------
      */

      message: {
        type: String,

        trim: true,

        maxlength: [
          500,
          "Viewing message cannot exceed 500 characters",
        ],

        default: "",
      },

      /*
      |--------------------------------------------------------------------------
      | Viewing status
      |--------------------------------------------------------------------------
      */

      status: {
        type: String,

        enum: [
          "requested",
          "confirmed",
          "rejected",
          "cancelled",
          "completed",
        ],

        default: "requested",
      },

      /*
      |--------------------------------------------------------------------------
      | Owner response
      |--------------------------------------------------------------------------
      */

      ownerResponse: {
        type: String,

        trim: true,

        maxlength: [
          500,
          "Owner response cannot exceed 500 characters",
        ],

        default: null,
      },

      /*
      |--------------------------------------------------------------------------
      | Status timestamps
      |--------------------------------------------------------------------------
      */

      confirmedAt: {
        type: Date,
        default: null,
      },

      rejectedAt: {
        type: Date,
        default: null,
      },

      cancelledAt: {
        type: Date,
        default: null,
      },

      completedAt: {
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
| Renter dashboard
|--------------------------------------------------------------------------
*/

viewingSchema.index({
  renter: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Owner viewing inbox
|--------------------------------------------------------------------------
*/

viewingSchema.index({
  owner: 1,
  status: 1,
  requestedDateTime: 1,
});

/*
|--------------------------------------------------------------------------
| Property viewing history
|--------------------------------------------------------------------------
*/

viewingSchema.index({
  property: 1,
  status: 1,
  requestedDateTime: 1,
});

const Viewing =
  mongoose.model(
    "Viewing",
    viewingSchema
  );

module.exports =
  Viewing;