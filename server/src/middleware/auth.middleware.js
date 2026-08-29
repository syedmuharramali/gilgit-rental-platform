const jwt = require("jsonwebtoken");

const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  const authorization = req.headers.authorization;

  if (
    authorization &&
    authorization.startsWith("Bearer ")
  ) {
    token = authorization.split(" ")[1];
  }

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
    return next(
      new AppError(
        `Your account is currently ${user.accountStatus}`,
        403
      )
    );
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
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return next();
    }

    const token =
      authorization.split(" ")[1];

    try {
      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );

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
    } catch (error) {
      // Invalid token is treated as anonymous
      // for this optional-auth route.
    }

    next();
  }
);