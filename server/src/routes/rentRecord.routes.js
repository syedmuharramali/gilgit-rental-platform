const express =
  require("express");

const {
  generateRentSchedule,
  getMyRentRecords,
  getOwnedRentRecords,
  getTenancyRentRecords,
  recordPayment,
} = require(
  "../controllers/rentRecord.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router =
  express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Dashboards
|--------------------------------------------------------------------------
*/

router.get(
  "/mine",
  getMyRentRecords
);

router.get(
  "/owned",
  getOwnedRentRecords
);

/*
|--------------------------------------------------------------------------
| Tenancy ledger
|--------------------------------------------------------------------------
*/

router.post(
  "/tenancy/:tenancyId/generate",
  generateRentSchedule
);

router.get(
  "/tenancy/:tenancyId",
  getTenancyRentRecords
);

/*
|--------------------------------------------------------------------------
| Payment recording
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/payment",
  recordPayment
);

module.exports = router;