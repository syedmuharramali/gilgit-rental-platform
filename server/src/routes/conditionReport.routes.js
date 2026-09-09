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

const {
  requireActiveTenancyForConditionReport,
} = require(
  "../middleware/tenancyLifecycle.middleware"
);

const router =
  express.Router();

router.use(protect);

router.post(
  "/tenancy/:tenancyId",
  requireActiveTenancyForConditionReport,
  createConditionReport
);

router.get(
  "/tenancy/:tenancyId",
  getTenancyConditionReports
);

router.post(
  "/:id/evidence",
  uploadConditionEvidence,
  uploadEvidenceController
);

router.get(
  "/:id/evidence/:evidenceId",
  viewConditionEvidence
);

router.patch(
  "/:id/confirm",
  confirmConditionReport
);

module.exports =
  router;