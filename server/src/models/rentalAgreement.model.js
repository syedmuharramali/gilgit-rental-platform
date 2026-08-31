const mongoose = require("mongoose");

const signatureSchema = new mongoose.Schema(
  {
    signed: {
      type: Boolean,
      default: false,
    },

    legalName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null,
    },

    signedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);

const rentalAgreementSchema =
  new mongoose.Schema(
    {
      tenancy: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Tenancy",
        required: true,
        unique: true,
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

      startDate: {
        type: Date,
        required: true,
      },

      durationMonths: {
        type: Number,
        required: true,
      },

      monthlyRent: {
        type: Number,
        required: true,
        min: 0,
      },

      securityDeposit: {
        type: Number,
        required: true,
        min: 0,
      },

      clauses: [
        {
          type: String,
          trim: true,
          maxlength: 500,
        },
      ],

      ownerSignature: {
        type: signatureSchema,
        default: () => ({}),
      },

      renterSignature: {
        type: signatureSchema,
        default: () => ({}),
      },

      status: {
        type: String,
        enum: [
          "pending_signatures",
          "executed",
          "cancelled",
        ],
        default: "pending_signatures",
      },

      executedAt: {
        type: Date,
        default: null,
      },

      createdBy: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

rentalAgreementSchema.index({
  owner: 1,
  createdAt: -1,
});

rentalAgreementSchema.index({
  renter: 1,
  createdAt: -1,
});

const RentalAgreement =
  mongoose.model(
    "RentalAgreement",
    rentalAgreementSchema
  );

module.exports =
  RentalAgreement;