const express = require("express");
const { body } = require("express-validator");

const {
  getVerificationRequests,
  getVerificationById,
  approveVerification,
  rejectVerification,
} = require(
  "../controllers/adminVerification.controller"
);

const {
  protect,
  authorize,
} = require("../middleware/auth.middleware");

const validateRequest = require(
  "../middleware/validate.middleware"
);

const router = express.Router();

// Every route below requires admin privileges.
router.use(protect);
router.use(authorize("admin"));

router.get(
  "/",
  getVerificationRequests
);

router.get(
  "/:id",
  getVerificationById
);

router.patch(
  "/:id/approve",
  approveVerification
);

router.patch(
  "/:id/reject",

  [
    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Rejection reason is required")
      .isLength({
        min: 5,
        max: 500,
      })
      .withMessage(
        "Rejection reason must contain between 5 and 500 characters"
      ),

    body("allowResubmission")
      .optional()
      .isBoolean()
      .withMessage(
        "allowResubmission must be true or false"
      ),
  ],

  validateRequest,

  rejectVerification
);

module.exports = router;