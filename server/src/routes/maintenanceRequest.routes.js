const express = require("express");

const {
  createMaintenanceRequest,
  getMyMaintenanceRequests,
  getReceivedMaintenanceRequests,
  updateMaintenanceRequest,
  cancelMaintenanceRequest,
} = require(
  "../controllers/maintenanceRequest.controller"
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
  getMyMaintenanceRequests
);

router.get(
  "/received",
  getReceivedMaintenanceRequests
);

router.post(
  "/tenancy/:tenancyId",
  createMaintenanceRequest
);

router.patch(
  "/:id",
  updateMaintenanceRequest
);

router.patch(
  "/:id/cancel",
  cancelMaintenanceRequest
);

module.exports = router;