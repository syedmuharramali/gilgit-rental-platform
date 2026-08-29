const express =
  require("express");

const {
  createTenancy,
  getMyTenancies,
  getOwnedTenancies,
  getTenancyById,
  endTenancy,
} = require(
  "../controllers/tenancy.controller"
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
| Renter / owner dashboards
|--------------------------------------------------------------------------
*/

router.get(
  "/mine",
  getMyTenancies
);

router.get(
  "/owned",
  getOwnedTenancies
);

/*
|--------------------------------------------------------------------------
| Create tenancy
|--------------------------------------------------------------------------
*/

router.post(
  "/from-application/:applicationId",
  createTenancy
);

/*
|--------------------------------------------------------------------------
| End tenancy
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/end",
  endTenancy
);

/*
|--------------------------------------------------------------------------
| Single tenancy
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  getTenancyById
);

module.exports = router;