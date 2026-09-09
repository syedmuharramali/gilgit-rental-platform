const express = require("express");

const {
  createAgreement,
  createAgreementFromTerms,
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
| New lifecycle: create agreement from accepted rental terms
|--------------------------------------------------------------------------
*/
router.post(
  "/rental-terms/:termsId",
  createAgreementFromTerms
);

/*
|--------------------------------------------------------------------------
| Legacy lifecycle: create agreement from active tenancy
|--------------------------------------------------------------------------
*/
router.post(
  "/tenancy/:tenancyId",
  createAgreement
);

/*
|--------------------------------------------------------------------------
| Sign / accept agreement
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