const express =
  require("express");

const {
  protect,
  authorize,
} = require(
  "../middleware/auth.middleware"
);

const {
  getPropertiesForReview,
  getPropertyForReview,
  approveProperty,
  rejectProperty,
} = require(
  "../controllers/adminProperty.controller"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| All routes below are admin-only
|--------------------------------------------------------------------------
*/

router.use(protect);
router.use(
  authorize("admin")
);

router.get(
  "/",
  getPropertiesForReview
);

router.get(
  "/:id",
  getPropertyForReview
);

router.patch(
  "/:id/approve",
  approveProperty
);

router.patch(
  "/:id/reject",
  rejectProperty
);

module.exports =
  router;