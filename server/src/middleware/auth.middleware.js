const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { getSessionToken } = require("../utils/session");

exports.protect = asyncHandler(async (req, res, next) => {
  // The session token only ever arrives in the httpOnly cookie; it is
  // never handed to page scripts, so there is no header to read.
  const token = getSessionToken(req);

  if (!token) {
    return next(
      new AppError(
        "You are not authenticated. Please log in.",
        401
      )
    );
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(
      new AppError(
        "Invalid or expired authentication token",
        401
      )
    );
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    return next(
      new AppError(
        "The user belonging to this token no longer exists",
        401
      )
    );
  }

  if (user.accountStatus !== "active") {
    const inactiveError = new AppError(
      `Your account is currently ${user.accountStatus}`,
      403
    );

    // Lets the client sign the person out instead of leaving a dashboard
    // where every request fails.
    inactiveError.code = "ACCOUNT_INACTIVE";

    return next(inactiveError);
  }

  req.user = user;

  next();
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError("Authentication is required", 401)
      );
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403
        )
      );
    }

    next();
  };
};

exports.optionalAuth = asyncHandler(
  async (req, res, next) => {
    const token =
      getSessionToken(req);

    if (!token) {
      return next();
    }

    let decoded;

    try {
      decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );
    } catch (error) {
      // An invalid or expired token is just an anonymous visitor here.
      return next();
    }

    // Database errors are NOT treated as "signed out": that would make
    // /auth/session delete a perfectly good cookie during a DB hiccup.
    const user =
      await User.findById(
        decoded.userId
      );

    if (
      user &&
      user.accountStatus ===
        "active"
    ) {
      req.user = user;
    }

    next();
  }
);