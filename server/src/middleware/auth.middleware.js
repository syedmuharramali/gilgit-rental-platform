const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { getSessionToken, readSessionUserId } = require("../utils/session");

/*
|--------------------------------------------------------------------------
| protect — the route needs a signed-in, active user
|--------------------------------------------------------------------------
|
| The session token only ever arrives in the httpOnly cookie (see
| utils/session.js); there is no Authorization header any more.
*/

exports.protect = asyncHandler(async (req, res, next) => {
  if (!getSessionToken(req)) {
    return next(new AppError("You are not authenticated. Please log in.", 401));
  }

  const userId = readSessionUserId(req);

  if (!userId) {
    return next(new AppError("Your session has expired. Please log in again.", 401));
  }

  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("The user belonging to this session no longer exists", 401));
  }

  if (user.accountStatus !== "active") {
    const inactive = new AppError(`Your account is currently ${user.accountStatus}`, 403);

    // Lets the client sign the person out instead of leaving a dashboard
    // where every request fails.
    inactive.code = "ACCOUNT_INACTIVE";

    return next(inactive);
  }

  req.user = user;
  next();
});

/*
|--------------------------------------------------------------------------
| optionalAuth — signed-in users get req.user, visitors pass through
|--------------------------------------------------------------------------
|
| A missing, invalid or expired token just means "visitor". A database
| error is NOT swallowed: treating it as "signed out" would make
| /auth/session delete a perfectly good cookie during a DB hiccup.
*/

exports.optionalAuth = asyncHandler(async (req, res, next) => {
  const userId = readSessionUserId(req);

  if (userId) {
    const user = await User.findById(userId);

    if (user?.accountStatus === "active") {
      req.user = user;
    }
  }

  next();
});

/*
|--------------------------------------------------------------------------
| authorize — the signed-in user must have one of these roles
|--------------------------------------------------------------------------
*/

exports.authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication is required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action", 403));
    }

    next();
  };
