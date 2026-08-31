const mongoose = require("mongoose");

const ConditionReport = require(
  "../models/conditionReport.model"
);

const Tenancy = require(
  "../models/tenancy.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);
const {
  uploadPrivateFile,
  getPrivateFileView,
  deleteFile,
} = require(
  "../services/storage.service"
);

const getAuthorizedTenancy =
  async (
    tenancyId,
    user
  ) => {
    if (
      !mongoose.isValidObjectId(
        tenancyId
      )
    ) {
      throw new AppError(
        "Invalid tenancy ID",
        400
      );
    }

    const tenancy =
      await Tenancy.findById(
        tenancyId
      );

    if (!tenancy) {
      throw new AppError(
        "Tenancy not found",
        404
      );
    }

    const userId =
      user._id.toString();

    const authorized =
      tenancy.owner.toString() ===
        userId ||
      tenancy.renter.toString() ===
        userId ||
      user.role === "admin";

    if (!authorized) {
      throw new AppError(
        "You are not authorized for this tenancy",
        403
      );
    }

    return tenancy;
  };

/*
|--------------------------------------------------------------------------
| Create condition report
|--------------------------------------------------------------------------
*/

exports.createConditionReport =
  asyncHandler(
    async (req, res, next) => {
      const tenancy =
        await getAuthorizedTenancy(
          req.params.tenancyId,
          req.user
        );

      const {
        reportType,
        items,
      } = req.body;

      if (
        ![
          "move_in",
          "move_out",
        ].includes(
          reportType
        )
      ) {
        return next(
          new AppError(
            "Report type must be move_in or move_out",
            400
          )
        );
      }

      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {
        return next(
          new AppError(
            "At least one condition item is required",
            400
          )
        );
      }

      if (items.length > 50) {
        return next(
          new AppError(
            "Condition report cannot contain more than 50 items",
            400
          )
        );
      }

      const allowedConditions =
        [
          "excellent",
          "good",
          "fair",
          "poor",
          "damaged",
        ];

      const cleanedItems =
        items.map(
          (item) => {
            const area =
              typeof item.area ===
              "string"
                ? item.area.trim()
                : "";

            if (
              !area ||
              area.length > 100
            ) {
              throw new AppError(
                "Every condition item requires a valid area name",
                400
              );
            }

            if (
              !allowedConditions.includes(
                item.condition
              )
            ) {
              throw new AppError(
                `Invalid condition for ${area}`,
                400
              );
            }

            const notes =
              typeof item.notes ===
              "string"
                ? item.notes.trim()
                : null;

            if (
              notes &&
              notes.length > 500
            ) {
              throw new AppError(
                "Condition item notes cannot exceed 500 characters",
                400
              );
            }

            return {
              area,
              condition:
                item.condition,
              notes:
                notes || null,
            };
          }
        );

      const existing =
        await ConditionReport.findOne({
          tenancy:
            tenancy._id,

          reportType,
        });

      if (existing) {
        return next(
          new AppError(
            `A ${reportType} condition report already exists for this tenancy`,
            409
          )
        );
      }

      const report =
        await ConditionReport.create({
          tenancy:
            tenancy._id,

          property:
            tenancy.property,

          owner:
            tenancy.owner,

          renter:
            tenancy.renter,

          reportType,

          items:
            cleanedItems,

          overallNotes:
            typeof req.body
              .overallNotes ===
            "string"
              ? req.body
                  .overallNotes
                  .trim()
              : null,

          createdBy:
            req.user._id,
        });

      res.status(201).json({
        success: true,

        message:
          "Condition report created successfully",

        data: {
          report,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get tenancy condition reports
|--------------------------------------------------------------------------
*/

exports.getTenancyConditionReports =
  asyncHandler(
    async (req, res) => {
      const tenancy =
        await getAuthorizedTenancy(
          req.params.tenancyId,
          req.user
        );

      const reports =
        await ConditionReport.find({
          tenancy:
            tenancy._id,
        })
          .populate(
            "createdBy",
            "name"
          )
          .sort({
            createdAt: 1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            reports.length,

          reports,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Confirm report
|--------------------------------------------------------------------------
*/

exports.confirmConditionReport =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid condition report ID",
            400
          )
        );
      }

      const report =
        await ConditionReport.findById(
          req.params.id
        );

      if (!report) {
        return next(
          new AppError(
            "Condition report not found",
            404
          )
        );
      }

      const userId =
        req.user._id.toString();

      const isOwner =
        report.owner.toString() ===
        userId;

      const isRenter =
        report.renter.toString() ===
        userId;

      if (
        !isOwner &&
        !isRenter
      ) {
        return next(
          new AppError(
            "You are not authorized to confirm this report",
            403
          )
        );
      }

      const confirmation =
        isOwner
          ? report
              .ownerConfirmation
          : report
              .renterConfirmation;

      if (
        confirmation.confirmed
      ) {
        return next(
          new AppError(
            "You have already confirmed this report",
            409
          )
        );
      }

      confirmation.confirmed =
        true;

      confirmation.confirmedAt =
        new Date();

      if (
        report
          .ownerConfirmation
          .confirmed &&
        report
          .renterConfirmation
          .confirmed
      ) {
        report.status =
          "confirmed";

        report.confirmedAt =
          new Date();
      }

      await report.save();

      res.status(200).json({
        success: true,

        message:
          report.status ===
          "confirmed"
            ? "Condition report fully confirmed"
            : "Condition report confirmed by you",

        data: {
          report,
        },
      });
    }
  );
  /*
|--------------------------------------------------------------------------
| Upload private evidence photos
| POST /api/condition-reports/:id/evidence
|--------------------------------------------------------------------------
*/

exports.uploadConditionEvidence =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid condition report ID",
            400
          )
        );
      }

      const report =
        await ConditionReport.findById(
          req.params.id
        );

      if (!report) {
        return next(
          new AppError(
            "Condition report not found",
            404
          )
        );
      }

      const userId =
        req.user._id.toString();

      const isOwner =
        report.owner.toString() ===
        userId;

      const isRenter =
        report.renter.toString() ===
        userId;

      if (!isOwner && !isRenter) {
        return next(
          new AppError(
            "You are not authorized to upload evidence for this report",
            403
          )
        );
      }

      if (
  report.status === "confirmed" ||
  report.ownerConfirmation.confirmed ||
  report.renterConfirmation.confirmed
) {
  return next(
    new AppError(
      "Evidence cannot be changed after either party has confirmed the report",
      400
    )
  );
}

      if (
        !req.files ||
        req.files.length === 0
      ) {
        return next(
          new AppError(
            "At least one evidence image is required",
            400
          )
        );
      }

      if (
        report.evidence.length +
          req.files.length >
        12
      ) {
        return next(
          new AppError(
            "A condition report may contain at most 12 evidence images",
            400
          )
        );
      }

      const uploadedFiles = [];

      try {
        for (const file of req.files) {
          const uploaded =
            await uploadPrivateFile(
              file,
              `condition-${report._id}`
            );

          uploadedFiles.push({
            fileId:
              uploaded.fileId,

            name:
              uploaded.name,

            mimeType:
              uploaded.mimeType,

            size:
              uploaded.sizeOriginal,

            uploadedBy:
              req.user._id,
          });
        }
      } catch (error) {
        for (
          const uploaded of
          uploadedFiles
        ) {
          try {
            await deleteFile(
              uploaded.fileId
            );
          } catch (_) {}
        }

        throw error;
      }

      report.evidence.push(
        ...uploadedFiles
      );

      await report.save();

      res.status(201).json({
        success: true,

        message:
          "Condition evidence uploaded successfully",

        data: {
          evidence:
            report.evidence,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Secure evidence viewing
| GET /api/condition-reports/:id/evidence/:evidenceId
|--------------------------------------------------------------------------
*/

exports.viewConditionEvidence =
  asyncHandler(
    async (req, res, next) => {
      const {
        id,
        evidenceId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(id) ||
        !mongoose.isValidObjectId(
          evidenceId
        )
      ) {
        return next(
          new AppError(
            "Invalid report or evidence ID",
            400
          )
        );
      }

      const report =
        await ConditionReport.findById(
          id
        );

      if (!report) {
        return next(
          new AppError(
            "Condition report not found",
            404
          )
        );
      }

      const userId =
        req.user._id.toString();

      const authorized =
        report.owner.toString() ===
          userId ||
        report.renter.toString() ===
          userId ||
        req.user.role === "admin";

      if (!authorized) {
        return next(
          new AppError(
            "You are not authorized to view this evidence",
            403
          )
        );
      }

      const evidence =
        report.evidence.id(
          evidenceId
        );

      if (!evidence) {
        return next(
          new AppError(
            "Evidence image not found",
            404
          )
        );
      }

      const fileData =
        await getPrivateFileView(
          evidence.fileId
        );

      res.setHeader(
        "Content-Type",
        evidence.mimeType
      );

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${evidence.name}"`
      );

      res.setHeader(
        "Cache-Control",
        "private, no-store, max-age=0"
      );

      res.send(
        Buffer.from(fileData)
      );
    }
  );