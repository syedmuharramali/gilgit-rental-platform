const mongoose = require("mongoose");

const ownerVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // We will later encrypt the full CNIC.
    // For now we keep only masked/reference information.
    cnicLast4: {
      type: String,
      required: true,
      match: [/^\d{4}$/, "CNIC last 4 digits must contain exactly 4 digits"],
    },

    documents: {
  cnicFront: {
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
  },

  cnicBack: {
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
  },

  selfie: {
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
  },
},

    status: {
      type: String,
      enum: [
        "pending",
        "verified",
        "rejected",
        "resubmission_required",
      ],
      default: "pending",
      index: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    adminNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
      select: false,
    },

    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Only one currently pending verification per user.
ownerVerificationSchema.index(
  {
    user: 1,
    status: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      status: "pending",
    },
  }
);

const OwnerVerification = mongoose.model(
  "OwnerVerification",
  ownerVerificationSchema
);

module.exports = OwnerVerification;