const OwnerVerification = require(
  "../models/ownerVerification.model"
);

const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.requireVerifiedOwner = asyncHandler(
  async (req, res, next) => {
    const verification =
      await OwnerVerification.findOne({
        user: req.user._id,
        status: "verified",
      });

    if (!verification) {
      return next(
        new AppError(
          "Identity verification is required before publishing properties",
          403
        )
      );
    }

    req.ownerVerification = verification;

    next();
  }
);