const express = require(
  "express"
);

const {
  createReview,
  getPropertyReviews,
  getMyReviews,
  getReceivedReviews,
} = require(
  "../controllers/review.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| Public
|--------------------------------------------------------------------------
*/

router.get(
  "/property/:propertyId",
  getPropertyReviews
);

/*
|--------------------------------------------------------------------------
| Protected
|--------------------------------------------------------------------------
*/

router.use(protect);

router.get(
  "/mine",
  getMyReviews
);

router.get(
  "/received",
  getReceivedReviews
);

router.post(
  "/tenancy/:tenancyId",
  createReview
);

module.exports = router;