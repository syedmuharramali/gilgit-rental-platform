const User = require("../models/user.model");
const AppError = require("../utils/AppError.js");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

/*
|--------------------------------------------------------------------------
| Register
| POST /api/auth/register
|--------------------------------------------------------------------------
*/

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    return next(
      new AppError("An account with this email already exists", 409)
    );
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    authProvider: "local",
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Account created successfully",

    data: {
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        accountStatus: user.accountStatus,
      },
    },
  });
});

/*
|--------------------------------------------------------------------------
| Login
| POST /api/auth/login
|--------------------------------------------------------------------------
*/

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({
    email: normalizedEmail,
  }).select("+password");

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  if (user.authProvider === "google" && !user.password) {
    return next(
      new AppError(
        "This account uses Google Sign-In. Please continue with Google.",
        400
      )
    );
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    return next(new AppError("Invalid email or password", 401));
  }

  if (user.accountStatus !== "active") {
    return next(
      new AppError(
        `Your account is currently ${user.accountStatus}`,
        403
      )
    );
  }

  user.lastLoginAt = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Login successful",

    data: {
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        accountStatus: user.accountStatus,
      },
    },
  });
});
/*
|--------------------------------------------------------------------------
| Current user
| GET /api/auth/me
|--------------------------------------------------------------------------
*/

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,

    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        avatar: req.user.avatar,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
        phoneVerified: req.user.phoneVerified,
        accountStatus: req.user.accountStatus,
        createdAt: req.user.createdAt,
      },
    },
  });
});