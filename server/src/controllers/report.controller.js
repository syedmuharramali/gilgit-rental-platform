const mongoose = require("mongoose");

const Report = require(
  "../models/report.model"
);

const Property = require(
  "../models/property.model"
);

const User = require(
  "../models/user.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);
const {
  safeCreateNotification,
  safeCreateNotifications,
} = require(
  "../services/notification.service"
);

const ALLOWED_REASONS = [
  "fraud",
  "misleading_listing",
  "harassment",
  "inappropriate_content",
  "duplicate_listing",
  "safety_concern",
  "other",
];

const ALLOWED_STATUSES = [
  "pending",
  "under_review",
  "resolved",
  "dismissed",
];

/*
|--------------------------------------------------------------------------
| Create report
| POST /api/reports
|--------------------------------------------------------------------------
*/

exports.createReport =
  asyncHandler(
    async (req, res, next) => {
      const {
        targetType,
        targetId,
        reason,
      } = req.body;

      if (
        ![
          "property",
          "user",
        ].includes(
          targetType
        )
      ) {
        return next(
          new AppError(
            "Target type must be property or user",
            400
          )
        );
      }

      if (
        !mongoose.isValidObjectId(
          targetId
        )
      ) {
        return next(
          new AppError(
            "Invalid target ID",
            400
          )
        );
      }

      if (
        !ALLOWED_REASONS.includes(
          reason
        )
      ) {
        return next(
          new AppError(
            "Invalid report reason",
            400
          )
        );
      }

      let description =
        null;

      if (
        req.body.description !==
        undefined
      ) {
        if (
          typeof req.body
            .description !==
          "string"
        ) {
          return next(
            new AppError(
              "Description must be a string",
              400
            )
          );
        }

        description =
          req.body.description.trim();

        if (
          description.length >
          1500
        ) {
          return next(
            new AppError(
              "Description cannot exceed 1500 characters",
              400
            )
          );
        }

        if (!description) {
          description = null;
        }
      }

      const query = {
        reporter:
          req.user._id,

        targetType,

        status: {
          $in: [
            "pending",
            "under_review",
          ],
        },
      };

      const reportData = {
        reporter:
          req.user._id,

        targetType,

        reason,

        description,
      };

      if (
        targetType ===
        "property"
      ) {
        const property =
          await Property.findOne({
            _id: targetId,

            isDeleted: {
              $ne: true,
            },
          }).select("_id");

        if (!property) {
          return next(
            new AppError(
              "Property not found",
              404
            )
          );
        }

        query.property =
          property._id;

        reportData.property =
          property._id;
      } else {
        const reportedUser =
          await User.findById(
            targetId
          ).select("_id");

        if (!reportedUser) {
          return next(
            new AppError(
              "User not found",
              404
            )
          );
        }

        if (
          reportedUser._id.toString() ===
          req.user._id.toString()
        ) {
          return next(
            new AppError(
              "You cannot report yourself",
              400
            )
          );
        }

        query.reportedUser =
          reportedUser._id;

        reportData.reportedUser =
          reportedUser._id;
      }

      const existingReport =
        await Report.findOne(
          query
        );

      if (existingReport) {
        return next(
          new AppError(
            "You already have an active report for this target",
            409
          )
        );
      }

      const report =
        await Report.create(
          reportData
        );
       const admins =
  await User.find({
    role: "admin",
    accountStatus:
      "active",
  }).select("_id");

await safeCreateNotifications(
  admins.map(
    (admin) => ({
      user:
        admin._id,

      type:
        "report",

      title:
        "New Report Submitted",

      message:
        `A new ${reason.replace(
          /_/g,
          " "
        )} report has been submitted.`,

      resourceType:
        "report",

      resourceId:
        report._id,
    })
  )
); 
      res.status(201).json({
        success: true,

        message:
          "Report submitted successfully",

        data: {
          report,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Logged-in user's reports
| GET /api/reports/mine
|--------------------------------------------------------------------------
*/

exports.getMyReports =
  asyncHandler(
    async (req, res) => {
      const reports =
        await Report.find({
          reporter:
            req.user._id,
        })
          .populate({
            path: "property",

            select:
              "title slug",
          })
          .populate({
            path: "reportedUser",

            select:
              "name avatar",
          })
          .sort({
            createdAt: -1,
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
| Admin: list reports
| GET /api/reports/admin
|--------------------------------------------------------------------------
*/

exports.getAdminReports =
  asyncHandler(
    async (req, res, next) => {
      const filter = {};

      if (
        req.query.status
      ) {
        if (
          !ALLOWED_STATUSES.includes(
            req.query.status
          )
        ) {
          return next(
            new AppError(
              "Invalid report status",
              400
            )
          );
        }

        filter.status =
          req.query.status;
      }

      if (
        req.query.targetType
      ) {
        if (
          ![
            "property",
            "user",
          ].includes(
            req.query.targetType
          )
        ) {
          return next(
            new AppError(
              "Invalid target type",
              400
            )
          );
        }

        filter.targetType =
          req.query.targetType;
      }

      const reports =
        await Report.find(filter)
          .select(
            "+adminNotes"
          )
          .populate({
            path: "reporter",

            select:
              "name email",
          })
          .populate({
            path: "property",

            select:
              "title slug listingStatus",
          })
          .populate({
            path: "reportedUser",

            select:
              "name email",
          })
          .populate({
            path: "reviewedBy",

            select:
              "name email",
          })
          .sort({
            createdAt: -1,
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
| Admin: update report status
| PATCH /api/reports/admin/:id
|--------------------------------------------------------------------------
*/

exports.updateReportStatus =
  asyncHandler(
    async (req, res, next) => {
      const { id } =
        req.params;

      if (
        !mongoose.isValidObjectId(
          id
        )
      ) {
        return next(
          new AppError(
            "Invalid report ID",
            400
          )
        );
      }

      const {
        status,
      } = req.body;

      if (
        !ALLOWED_STATUSES.includes(
          status
        )
      ) {
        return next(
          new AppError(
            "Invalid report status",
            400
          )
        );
      }

      let adminNotes;

      if (
        req.body.adminNotes !==
        undefined
      ) {
        if (
          typeof req.body
            .adminNotes !==
          "string"
        ) {
          return next(
            new AppError(
              "Admin notes must be a string",
              400
            )
          );
        }

        adminNotes =
          req.body.adminNotes.trim();

        if (
          adminNotes.length >
          1000
        ) {
          return next(
            new AppError(
              "Admin notes cannot exceed 1000 characters",
              400
            )
          );
        }
      }

      const report =
        await Report.findById(
          id
        ).select(
          "+adminNotes"
        );

      if (!report) {
        return next(
          new AppError(
            "Report not found",
            404
          )
        );
      }

      report.status =
        status;

      if (
        adminNotes !==
        undefined
      ) {
        report.adminNotes =
          adminNotes || null;
      }

      /*
      |--------------------------------------------------------------------------
      | Any admin action counts as review
      |--------------------------------------------------------------------------
      */

      report.reviewedBy =
        req.user._id;

      report.reviewedAt =
        new Date();

      await report.save();
      await safeCreateNotification({
  user:
    report.reporter,

  type: "report",

  title:
    status === "resolved"
      ? "Report Resolved"
      : status === "dismissed"
        ? "Report Dismissed"
        : "Report Status Updated",

  message:
    status === "resolved"
      ? "Your report has been reviewed and resolved by an administrator."
      : status === "dismissed"
        ? "Your report has been reviewed and dismissed by an administrator."
        : `Your report status is now ${status.replace(
            /_/g,
            " "
          )}.`,

  resourceType:
    "report",

  resourceId:
    report._id,
});

      await report.populate([
        {
          path: "reporter",
          select:
            "name email",
        },
        {
          path: "property",
          select:
            "title slug listingStatus",
        },
        {
          path: "reportedUser",
          select:
            "name email",
        },
        {
          path: "reviewedBy",
          select:
            "name email",
        },
      ]);

      res.status(200).json({
        success: true,

        message:
          "Report updated successfully",

        data: {
          report,
        },
      });
    }
  );