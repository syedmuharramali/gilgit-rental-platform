const express = require("express");
const { body } = require("express-validator");

const {
  submitVerification,
  getMyVerification,
} = require("../controllers/ownerVerification.controller");

const {
  protect,
} = require("../middleware/auth.middleware");

const validateRequest = require("../middleware/validate.middleware");

const router = express.Router();
const {
  uploadVerificationDocuments,
} = require(
  "../middleware/upload.middleware"
);

/*
|--------------------------------------------------------------------------
| Get current user's verification status
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  protect,
  getMyVerification
);

/*
|--------------------------------------------------------------------------
| Submit verification
|--------------------------------------------------------------------------
*/

router.post(
  "/",

  protect,

  uploadVerificationDocuments,

  [
    body("cnicLast4")
      .trim()
      .matches(/^\d{4}$/)
      .withMessage(
        "CNIC last 4 digits must contain exactly 4 digits"
      ),
  ],

  validateRequest,

  submitVerification
);

module.exports = router;