const express =
  require("express");

const {
  createApplication,
  getMyApplications,
  getReceivedApplications,
  getPropertyApplications,
  acceptApplication,
  rejectApplication,
  withdrawApplication,
} = require(
  "../controllers/application.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const {
  blockIfPropertyHasAcceptedApplication,
} = require(
  "../middleware/applicationState.middleware"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| All application routes require authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Applicant routes
|--------------------------------------------------------------------------
*/

router.get(
  "/mine",
  getMyApplications
);

router.post(
  "/:propertyId",
  blockIfPropertyHasAcceptedApplication,
  createApplication
);

router.patch(
  "/:id/withdraw",
  withdrawApplication
);

/*
|--------------------------------------------------------------------------
| Owner routes
|--------------------------------------------------------------------------
*/

router.get(
  "/received",
  getReceivedApplications
);

router.get(
  "/property/:propertyId",
  getPropertyApplications
);

router.patch(
  "/:id/accept",
  acceptApplication
);

router.patch(
  "/:id/reject",
  rejectApplication
);

module.exports =
  router;