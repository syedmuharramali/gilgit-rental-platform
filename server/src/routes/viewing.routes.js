const express =
  require("express");

const {
  createViewingRequest,
  getMyViewings,
  getReceivedViewings,
  getPropertyViewings,
  confirmViewing,
  rejectViewing,
  cancelViewing,
  completeViewing,
} = require(
  "../controllers/viewing.controller"
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
| Authentication required
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Renter routes
|--------------------------------------------------------------------------
*/

router.get(
  "/mine",
  getMyViewings
);

router.post(
  "/:propertyId",
  createViewingRequest
);

router.patch(
  "/:id/cancel",
  cancelViewing
);

/*
|--------------------------------------------------------------------------
| Owner routes
|--------------------------------------------------------------------------
*/

router.get(
  "/received",
  getReceivedViewings
);

router.get(
  "/property/:propertyId",
  getPropertyViewings
);

router.patch(
  "/:id/confirm",
  confirmViewing
);

router.patch(
  "/:id/reject",
  rejectViewing
);

router.patch(
  "/:id/complete",
  completeViewing
);

module.exports =
  router;