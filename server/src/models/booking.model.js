const mongoose = require("mongoose");

/*
|--------------------------------------------------------------------------
| Booking — a night-by-night stay at a hotel or guest house
|--------------------------------------------------------------------------
|
| requested  → the guest asked; nothing is held yet
| confirmed  → the hotel accepted; these rooms are taken for those nights
| declined   → the hotel said no
| cancelled  → the guest (until 24h before check-in) or the hotel withdrew
| expired    → never answered before the check-in date
| completed  → check-out date has passed; the guest may leave a review
|
| The room type is copied in (name, price) so later price changes never
| alter a booking that already exists.
|--------------------------------------------------------------------------
*/

const BOOKING_STATUSES = [
  "requested",
  "confirmed",
  "declined",
  "cancelled",
  "expired",
  "completed",
];

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    roomType: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      nightlyPrice: {
        type: Number,
        required: true,
        min: 0,
      },

      maxGuests: {
        type: Number,
        required: true,
        min: 1,
      },
    },

    rooms: {
      type: Number,
      required: true,
      min: 1,
      max: 20,
    },

    guests: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    checkIn: {
      type: Date,
      required: true,
    },

    checkOut: {
      type: Date,
      required: true,
    },

    nights: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    message: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: null,
    },

    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: "requested",
    },

    ownerResponse: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },

    cancelledBy: {
      type: String,
      enum: ["guest", "owner", null],
      default: null,
    },

    respondedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    /*
    | The guest's review of the stay, written once after it is completed.
    | Kept on the booking so there is exactly one per stay.
    */
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },

      comment: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: null,
      },

      createdAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Availability checks: confirmed bookings of a room type that overlap a range.
bookingSchema.index({
  property: 1,
  "roomType.id": 1,
  status: 1,
  checkIn: 1,
  checkOut: 1,
});

bookingSchema.index({ guest: 1, createdAt: -1 });
bookingSchema.index({ owner: 1, createdAt: -1 });

// Hourly sweep: requests to expire and stays to complete.
bookingSchema.index({ status: 1, checkIn: 1 });
bookingSchema.index({ status: 1, checkOut: 1 });

// Public reviews for a stay.
bookingSchema.index({ property: 1, "review.createdAt": -1 });

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
module.exports.BOOKING_STATUSES = BOOKING_STATUSES;
