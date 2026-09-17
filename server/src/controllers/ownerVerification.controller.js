const OwnerVerification = require("../models/ownerVerification.model");

const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const {
  uploadPrivateFile,
  deleteFile,
} = require("../services/storage.service");

/*
|--------------------------------------------------------------------------
| Submit owner verification
| POST /api/owner-verification
|--------------------------------------------------------------------------
*/

exports.submitVerification = asyncHandler(
  async (req, res, next) => {
    const { cnicLast4 } = req.body;

    const cnicFront =
      req.files?.cnicFront?.[0];

    const cnicBack =
      req.files?.cnicBack?.[0];

    const selfie =
      req.files?.selfie?.[0];

    if (
      !cnicFront ||
      !cnicBack ||
      !selfie
    ) {
      return next(
        new AppError(
          "CNIC front, CNIC back and selfie are required",
          400
        )
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Existing verification checks
    |--------------------------------------------------------------------------
    */

    const existingPending =
      await OwnerVerification.findOne({
        user: req.user._id,
        status: "pending",
      });

    if (existingPending) {
      return next(
        new AppError(
          "You already have a verification request under review",
          409
        )
      );
    }

    const alreadyVerified =
      await OwnerVerification.findOne({
        user: req.user._id,
        status: "verified",
      });

    if (alreadyVerified) {
      return next(
        new AppError(
          "Your identity has already been verified",
          409
        )
      );
    }

    const previousAttempts =
      await OwnerVerification.countDocuments({
        user: req.user._id,
      });

    const attemptNumber =
      previousAttempts + 1;

    /*
    |--------------------------------------------------------------------------
    | Appwrite uploads
    |--------------------------------------------------------------------------
    */

    const uploadedFileIds = [];

    try {
      const frontUpload =
        await uploadPrivateFile(
          cnicFront,
          `cnic-front-${req.user._id}`
        );

      uploadedFileIds.push(
        frontUpload.fileId
      );

      const backUpload =
        await uploadPrivateFile(
          cnicBack,
          `cnic-back-${req.user._id}`
        );

      uploadedFileIds.push(
        backUpload.fileId
      );

      const selfieUpload =
        await uploadPrivateFile(
          selfie,
          `selfie-${req.user._id}`
        );

      uploadedFileIds.push(
        selfieUpload.fileId
      );

      /*
      |--------------------------------------------------------------------------
      | Save verification in MongoDB
      |--------------------------------------------------------------------------
      */

      const verification =
        await OwnerVerification.create({
          user: req.user._id,

          cnicLast4,

          documents: {
            cnicFront: {
              fileId:
                frontUpload.fileId,

              name:
                frontUpload.name,

              mimeType:
                frontUpload.mimeType,

              size:
                frontUpload.sizeOriginal,
            },

            cnicBack: {
              fileId:
                backUpload.fileId,

              name:
                backUpload.name,

              mimeType:
                backUpload.mimeType,

              size:
                backUpload.sizeOriginal,
            },

            selfie: {
              fileId:
                selfieUpload.fileId,

              name:
                selfieUpload.name,

              mimeType:
                selfieUpload.mimeType,

              size:
                selfieUpload.sizeOriginal,
            },
          },

          attemptNumber,

          status: "pending",

          submittedAt: new Date(),
        });

      res.status(201).json({
        success: true,

        message:
          "Identity verification submitted successfully",

        data: {
          verification: {
            id:
              verification._id,

            status:
              verification.status,

            cnicLast4:
              verification.cnicLast4,

            attemptNumber:
              verification.attemptNumber,

            submittedAt:
              verification.submittedAt,
          },
        },
      });
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | Cleanup Appwrite if MongoDB/upload fails midway
      |--------------------------------------------------------------------------
      */

      await Promise.allSettled(
        uploadedFileIds.map(
          (fileId) =>
            deleteFile(fileId)
        )
      );

      return next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| Get my latest verification status
| GET /api/owner-verification/me
|--------------------------------------------------------------------------
*/

exports.getMyVerification = asyncHandler(async (req, res) => {
  const verification = await OwnerVerification.findOne({
    user: req.user._id,
  })
    .sort({
      createdAt: -1,
    })
    .select("-documents");

  if (!verification) {
    return res.status(200).json({
      success: true,

      data: {
        verification: null,
        ownerVerified: false,
      },
    });
  }

  res.status(200).json({
    success: true,

    data: {
      ownerVerified: verification.status === "verified",

      verification: {
        id: verification._id,
        status: verification.status,
        cnicLast4: verification.cnicLast4,
        attemptNumber: verification.attemptNumber,
        rejectionReason: verification.rejectionReason,
        submittedAt: verification.submittedAt,
        reviewedAt: verification.reviewedAt,
      },
    },
  });
});