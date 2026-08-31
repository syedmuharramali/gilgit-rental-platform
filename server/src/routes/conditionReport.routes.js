const express = require("express");

const {
  createConditionReport,
  getTenancyConditionReports,
  confirmConditionReport,

  uploadConditionEvidence:
    uploadEvidenceController,

  viewConditionEvidence,
} = require(
  "../controllers/conditionReport.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const {
  uploadConditionEvidence,
} = require(
  "../middleware/upload.middleware"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| All routes require authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Create condition report
|--------------------------------------------------------------------------
*/

router.post(
  "/tenancy/:tenancyId",
  createConditionReport
);

/*
|--------------------------------------------------------------------------
| Get tenancy condition reports
|--------------------------------------------------------------------------
*/

router.get(
  "/tenancy/:tenancyId",
  getTenancyConditionReports
);

/*
|--------------------------------------------------------------------------
| Upload private evidence
|--------------------------------------------------------------------------
*/

router.post(
  "/:id/evidence",
  uploadConditionEvidence,
  uploadEvidenceController
);

/*
|--------------------------------------------------------------------------
| Securely view evidence
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/evidence/:evidenceId",
  viewConditionEvidence
);

/*
|--------------------------------------------------------------------------
| Confirm condition report
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/confirm",
  confirmConditionReport
);

module.exports =
  router;