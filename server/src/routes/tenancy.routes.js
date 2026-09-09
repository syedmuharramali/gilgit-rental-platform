const express =
  require("express");

const {
  createTenancy,
} = require(
  "../controllers/tenancy.controller"
);

const {
  endTenancy,
} = require(
  "../controllers/tenancyEnd.controller"
);

const {
  getMyTenancies,
  getOwnedTenancies,
  getTenancyById,
} = require(
  "../controllers/tenancyLifecycle.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router =
  express.Router();

router.use(protect);

router.get(
  "/mine",
  getMyTenancies
);

router.get(
  "/owned",
  getOwnedTenancies
);

router.post(
  "/from-application/:applicationId",
  createTenancy
);

router.patch(
  "/:id/end",
  endTenancy
);

router.get(
  "/:id",
  getTenancyById
);

module.exports = router;