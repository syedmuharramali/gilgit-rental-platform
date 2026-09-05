const express = require("express");
const { body } = require("express-validator");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  googleLogin,
  getMe,
} = require("../controllers/auth.controller");

const { protect } = require("../middleware/auth.middleware");
const validateRequest = require("../middleware/validate.middleware");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,

  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});

/*
|--------------------------------------------------------------------------
| Register
|--------------------------------------------------------------------------
*/

router.post(
  "/register",

  authLimiter,

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
      .normalizeEmail(),

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

  authLimiter,

  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),

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

  authLimiter,

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
| Current user
|--------------------------------------------------------------------------
*/

router.get("/me", protect, getMe);

module.exports = router;