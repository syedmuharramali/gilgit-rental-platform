const express = require("express");

const {
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
