const OwnerVerification = require(
  "../models/ownerVerification.model"
);

const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/*
|--------------------------------------------------------------------------
| Get verification requests
| GET /api/admin/verifications
|--------------------------------------------------------------------------
*/

exports.getVerificationRequests = asyncHandler(
  async (req, res) => {
    const {
      status = "pending",
      page = 1,
      limit = 20,
    } = req.query;

    const allowedStatuses = [
      "pending",
      "verified",
      "rejected",
      "resubmission_required",
    ];

    if (!allowedStatuses.includes(status)) {
      throw new AppError(
        "Invalid verification status",
        400
      );
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(limit) || 20, 1),
      100
    );

    const skip = (pageNumber - 1) * pageSize;

    const filter = {
      status,
    };

    const [verifications, total] = await Promise.all([
      OwnerVerification.find(filter)
  .select("-documents")
  .populate(
    "user",
    "name email phone accountStatus"
  )
        .sort({
          submittedAt: 1,
        })
        .skip(skip)
        .limit(pageSize),

      OwnerVerification.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,

      data: {
        verifications,

        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Get one verification
| GET /api/admin/verifications/:id
|--------------------------------------------------------------------------
*/

exports.getVerificationById = asyncHandler(
  async (req, res, next) => {
    const verification =
      await OwnerVerification.findById(req.params.id)
        .populate(
          "user",
          "name email phone accountStatus createdAt"
        );

    if (!verification) {
      return next(
        new AppError(
          "Verification request not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,

      data: {
        verification,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Approve verification
| PATCH /api/admin/verifications/:id/approve
|--------------------------------------------------------------------------
*/

exports.approveVerification = asyncHandler(
  async (req, res, next) => {
    const verification =
      await OwnerVerification.findById(req.params.id);

    if (!verification) {
      return next(
        new AppError(
          "Verification request not found",
          404
        )
      );
    }

    if (verification.status !== "pending") {
      return next(
        new AppError(
          `This verification request is already ${verification.status}`,
          409
        )
      );
    }

    verification.status = "verified";
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    verification.rejectionReason = null;

    await verification.save();

    res.status(200).json({
      success: true,
      message: "Owner identity verified successfully",

      data: {
        verification: {
          id: verification._id,
          status: verification.status,
          reviewedAt: verification.reviewedAt,
          reviewedBy: verification.reviewedBy,
        },
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Reject verification
| PATCH /api/admin/verifications/:id/reject
|--------------------------------------------------------------------------
*/

exports.rejectVerification = asyncHandler(
  async (req, res, next) => {
    const {
      reason,
      allowResubmission = true,
    } = req.body;

    const verification =
      await OwnerVerification.findById(req.params.id);

    if (!verification) {
      return next(
        new AppError(
          "Verification request not found",
          404
        )
      );
    }

    if (verification.status !== "pending") {
      return next(
        new AppError(
          `This verification request is already ${verification.status}`,
          409
        )
      );
    }

    verification.status = allowResubmission
      ? "resubmission_required"
      : "rejected";

    verification.rejectionReason = reason;
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;

    await verification.save();

    res.status(200).json({
      success: true,

      message: allowResubmission
        ? "Verification rejected. Resubmission is allowed."
        : "Verification rejected.",

      data: {
        verification: {
          id: verification._id,
          status: verification.status,
          rejectionReason:
            verification.rejectionReason,
          reviewedAt: verification.reviewedAt,
        },
      },
    });
  }
);