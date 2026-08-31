const express = require(
  "express"
);

const {
  createReport,
  getMyReports,
  getAdminReports,
  updateReportStatus,
} = require(
  "../controllers/report.controller"
);

const {
  protect,
  authorize,
} = require(
  "../middleware/auth.middleware"
);

const router =
  express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| User reports
|--------------------------------------------------------------------------
*/

router.post(
  "/",
  createReport
);

router.get(
  "/mine",
  getMyReports
);

/*
|--------------------------------------------------------------------------
| Admin reports
|--------------------------------------------------------------------------
*/

router.get(
  "/admin",
  authorize("admin"),
  getAdminReports
);

router.patch(
  "/admin/:id",
  authorize("admin"),
  updateReportStatus
);

module.exports = router;