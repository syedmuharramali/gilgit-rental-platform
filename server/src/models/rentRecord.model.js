const mongoose = require("mongoose");

const rentRecordSchema =
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

      period: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/,
      },

      dueDate: {
        type: Date,
        required: true,
      },

      amountDue: {
        type: Number,
        required: true,
        min: 0,
      },

      amountPaid: {
        type: Number,
        default: 0,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "pending",
          "partial",
          "paid",
        ],
        default: "pending",
      },

      paidAt: {
        type: Date,
        default: null,
      },

      notes: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null,
      },

      recordedBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| One rent record per tenancy per month
|--------------------------------------------------------------------------
*/

rentRecordSchema.index(
  {
    tenancy: 1,
    period: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| Owner dashboard
|--------------------------------------------------------------------------
*/

rentRecordSchema.index({
  owner: 1,
  dueDate: 1,
});

/*
|--------------------------------------------------------------------------
| Renter dashboard
|--------------------------------------------------------------------------
*/

rentRecordSchema.index({
  renter: 1,
  dueDate: 1,
});

/*
|--------------------------------------------------------------------------
| Tenancy rent history
|--------------------------------------------------------------------------
*/

rentRecordSchema.index({
  tenancy: 1,
  dueDate: 1,
});

const RentRecord =
  mongoose.model(
    "RentRecord",
    rentRecordSchema
  );

module.exports = RentRecord;