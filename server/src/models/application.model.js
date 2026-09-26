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

      /*
      | Hostels: the seater option applied for, copied at the time so a later
      | price change doesn't rewrite the application. `units` is what an
      | acceptance holds from that option's free places: one bed per person
      | (per-person pricing) or one room (per-room pricing).
      */
      hostelRoom: {
        type: new mongoose.Schema(
          {
            id: { type: mongoose.Schema.Types.ObjectId, required: true },
            seater: { type: Number, required: true },
            price: { type: Number, required: true },
            pricing: { type: String, enum: ["per_person", "per_room"], required: true },
          },
          { _id: false }
        ),
        default: null,
      },

      units: {
        type: Number,
        min: 1,
        default: null,
      },

      /*
      | Accepted applications must be unique per property for homes and
      | shops (one tenant). Hostels take many: their accepted applications
      | get a slotKey (their own id), so the unique index below treats each
      | one as its own slot. Homes leave it null, which keeps the old rule.
      */
      slotKey: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
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

applicationSchema.index(
  {
    property: 1,
    slotKey: 1,
  },
  {
    unique: true,

    partialFilterExpression: {
      status: "accepted",
    },
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

/*
|--------------------------------------------------------------------------
| Reserve a listing as soon as an application is accepted
|--------------------------------------------------------------------------
|
| The listing remains publicly visible, but the separate reservation state
| lets the frontend explain that a renter has been selected and prevents the
| flow from pretending the rental is already active.
|--------------------------------------------------------------------------
*/
applicationSchema.post("save", async function (application) {
  // Hostels are never reserved as a whole: other seats stay open.
  if (application.status !== "accepted" || application.slotKey) return;

  const Property = mongoose.model("Property");

  await Property.updateOne(
    {
      _id: application.property,
      listingStatus: "published",
    },
    {
      $set: {
        reservationStatus: "reserved",
        reservedAt: new Date(),
      },
    }
  );
});

const Application =
  mongoose.model(
    "Application",
    applicationSchema
  );

module.exports =
  Application;
