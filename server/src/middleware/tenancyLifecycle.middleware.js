const mongoose = require("mongoose");

const Tenancy = require("../models/tenancy.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.requireActiveTenancyForConditionReport = asyncHandler(
  async (req, _res, next) => {
    const { tenancyId } = req.params;

    if (!mongoose.isValidObjectId(tenancyId)) {
      return next(new AppError("Invalid tenancy ID", 400));
    }

    const tenancy = await Tenancy.findById(tenancyId).select(
      "owner renter status"
    );

    if (!tenancy) {
      return next(new AppError("Tenancy not found", 404));
    }

    const userId = req.user._id.toString();
    const authorized =
      tenancy.owner.toString() === userId ||
      tenancy.renter.toString() === userId ||
      req.user.role === "admin";

    if (!authorized) {
      return next(
        new AppError("You are not authorized for this tenancy", 403)
      );
    }

    if (tenancy.status !== "active") {
      return next(
        new AppError(
          "Condition reports can only be created while the rental is active",
          400
        )
      );
    }

    next();
  }
);
