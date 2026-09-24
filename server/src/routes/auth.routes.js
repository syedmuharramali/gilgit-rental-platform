const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  googleLogin,
  verifyEmail,
  resendVerification,
  getMe,
  updateMe,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");
const validateRequest = require("../middleware/validate.middleware");

const router = express.Router();

/*
| One limiter per purpose, each with its own counter. A single shared
| counter meant a busy room on one IP (a lab, a demo, a mobile carrier)
| used it up with ordinary signups and resends, and then nobody could
| even open their confirmation link for 15 minutes.
*/

const makeLimiter = (limit, extra = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,

    standardHeaders: "draft-7",
    legacyHeaders: false,

    message: {
      success: false,
      message: "Too many authentication attempts. Please try again later.",
    },

    ...extra,
  });

// Only failed sign-ins count, so guessing is still capped but people who
// type their password correctly are never locked out.
const signInLimiter = makeLimiter(20, { skipSuccessfulRequests: true });
const registerLimiter = makeLimiter(20);
const emailLinkLimiter = makeLimiter(30);

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

router.post(
  "/register",

  registerLimiter,

  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({
        min: 2,
        max: 80,
      })
      .withMessage("Name must be between 2 and 80 characters"),

    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Enter a valid email address")
      .toLowerCase(),

    body("password")
      .isLength({
        min: 8,
      })
      .withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/)
      .withMessage("Password must contain an uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain a lowercase letter")
      .matches(/[0-9]/)
      .withMessage("Password must contain a number"),
  ],

  validateRequest,

  register
);

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

router.post(
  "/login",

  signInLimiter,

  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address")
      .toLowerCase(),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],

  validateRequest,

  login
);

/*
|--------------------------------------------------------------------------
| Google Sign-In
|--------------------------------------------------------------------------
*/

router.post(
  "/google",

  signInLimiter,

  [
    body("credential")
      .isString()
      .withMessage("Google credential is required")
      .trim()
      .notEmpty()
      .withMessage("Google credential is required")
      .isLength({
        max: 10000,
      })
      .withMessage("Google credential is invalid"),
  ],

  validateRequest,

  googleLogin
);

/*
|--------------------------------------------------------------------------
| Email confirmation
|--------------------------------------------------------------------------
*/

router.post(
  "/verify-email",

  emailLinkLimiter,

  [
    body("token")
      .isString()
      .withMessage("Confirmation token is required")
      .trim()
      .notEmpty()
      .withMessage("Confirmation token is required")
      .isLength({
        max: 200,
      })
      .withMessage("Confirmation token is invalid"),
  ],

  validateRequest,

  verifyEmail
);

router.post(
  "/resend-verification",

  emailLinkLimiter,

  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address")
      .toLowerCase(),
  ],

  validateRequest,

  resendVerification
);

/*
|--------------------------------------------------------------------------
| Current user
|--------------------------------------------------------------------------
*/

router.get("/me", protect, getMe);

router.patch(
  "/me",
  protect,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage("Name must be between 2 and 80 characters"),

    body("phone")
      .optional({ nullable: true, checkFalsy: true })
      .trim()
      .matches(/^[0-9+()\-\s]{7,30}$/)
      .withMessage("Enter a valid phone number"),
  ],
  validateRequest,
  updateMe
);

module.exports = router;
