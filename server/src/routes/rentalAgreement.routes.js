const express = require("express");

const {
  createAgreement,
  getMyAgreements,
  getAgreementById,
  signAgreement,
} = require(
  "../controllers/rentalAgreement.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Get my agreements
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  getMyAgreements
);

/*
|--------------------------------------------------------------------------
| Create agreement from tenancy
|--------------------------------------------------------------------------
*/

router.post(
  "/tenancy/:tenancyId",
  createAgreement
);

/*
|--------------------------------------------------------------------------
| Sign agreement
|--------------------------------------------------------------------------
*/

router.patch(
  "/:id/sign",
  signAgreement
);

/*
|--------------------------------------------------------------------------
| Get single agreement
|--------------------------------------------------------------------------
*/

router.get(
  "/:id",
  getAgreementById
);

module.exports = router;