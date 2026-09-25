const express = require("express");

const {
  getAvailability,
  createBooking,
  getMyBookings,
  getReceivedBookings,
  confirmBooking,
  declineBooking,
  cancelBooking,
  reviewBooking,
} = require("../controllers/booking.controller");

const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.get("/availability/:propertyId", getAvailability);

/*
|--------------------------------------------------------------------------
| Signed in
|--------------------------------------------------------------------------
*/

router.use(protect);

router.get("/mine", getMyBookings);
router.get("/received", getReceivedBookings);

router.post("/:propertyId", createBooking);

router.patch("/:id/confirm", confirmBooking);
router.patch("/:id/decline", declineBooking);
router.patch("/:id/cancel", cancelBooking);

router.post("/:id/review", reviewBooking);

module.exports = router;
