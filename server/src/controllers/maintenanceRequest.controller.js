const mongoose = require("mongoose");

const MaintenanceRequest =
  require(
    "../models/maintenanceRequest.model"
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

/*
|--------------------------------------------------------------------------
| Renter creates request
|--------------------------------------------------------------------------
*/

exports.createMaintenanceRequest =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.tenancyId
        )
      ) {
        return next(
          new AppError(
            "Invalid tenancy ID",
            400
          )
        );
      }

      const tenancy =
        await Tenancy.findOne({
          _id:
            req.params
              .tenancyId,

          renter:
            req.user._id,

          status:
            "active",
        });

      if (!tenancy) {
        return next(
          new AppError(
            "Active tenancy not found",
            404
          )
        );
      }

      const title =
        typeof req.body.title ===
        "string"
          ? req.body.title.trim()
          : "";

      const description =
        typeof req.body
          .description ===
        "string"
          ? req.body
              .description
              .trim()
          : "";

      if (
        !title ||
        title.length > 150
      ) {
        return next(
          new AppError(
            "A valid maintenance request title is required",
            400
          )
        );
      }

      if (
        !description ||
        description.length >
          1500
      ) {
        return next(
          new AppError(
            "A valid maintenance request description is required",
            400
          )
        );
      }

      const categories = [
        "electricity",
        "water",
        "heating",
        "plumbing",
        "appliance",
        "security",
        "structural",
        "internet",
        "other",
      ];

      const priorities = [
        "low",
        "medium",
        "high",
        "urgent",
      ];

      const category =
        req.body.category ||
        "other";

      const priority =
        req.body.priority ||
        "medium";

      if (
        !categories.includes(
          category
        )
      ) {
        return next(
          new AppError(
            "Invalid maintenance category",
            400
          )
        );
      }

      if (
        !priorities.includes(
          priority
        )
      ) {
        return next(
          new AppError(
            "Invalid maintenance priority",
            400
          )
        );
      }

      const request =
        await MaintenanceRequest.create({
          tenancy:
            tenancy._id,

          property:
            tenancy.property,

          owner:
            tenancy.owner,

          renter:
            tenancy.renter,

          title,

          description,

          category,

          priority,
        });

      res.status(201).json({
        success: true,

        message:
          "Maintenance request submitted successfully",

        data: {
          request,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Renter requests
|--------------------------------------------------------------------------
*/

exports.getMyMaintenanceRequests =
  asyncHandler(
    async (req, res) => {
      const requests =
        await MaintenanceRequest.find({
          renter:
            req.user._id,
        })
          .populate(
            "property",
            "title slug"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            requests.length,

          requests,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Owner requests
|--------------------------------------------------------------------------
*/

exports.getReceivedMaintenanceRequests =
  asyncHandler(
    async (req, res) => {
      const filter = {
        owner:
          req.user._id,
      };

      if (
        req.query.status
      ) {
        const statuses = [
          "pending",
          "in_progress",
          "resolved",
          "cancelled",
        ];

        if (
          !statuses.includes(
            req.query.status
          )
        ) {
          throw new AppError(
            "Invalid maintenance status",
            400
          );
        }

        filter.status =
          req.query.status;
      }

      const requests =
        await MaintenanceRequest.find(
          filter
        )
          .populate(
            "property",
            "title slug"
          )
          .populate(
            "renter",
            "name email phone"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            requests.length,

          requests,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Owner updates request
|--------------------------------------------------------------------------
*/

exports.updateMaintenanceRequest =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid maintenance request ID",
            400
          )
        );
      }

      const request =
        await MaintenanceRequest.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,
        });

      if (!request) {
        return next(
          new AppError(
            "Maintenance request not found",
            404
          )
        );
      }

      const statuses = [
        "pending",
        "in_progress",
        "resolved",
      ];

      if (
        req.body.status &&
        !statuses.includes(
          req.body.status
        )
      ) {
        return next(
          new AppError(
            "Owner may set status to pending, in_progress or resolved",
            400
          )
        );
      }

      if (
        req.body.status
      ) {
        request.status =
          req.body.status;

        request.resolvedAt =
          req.body.status ===
          "resolved"
            ? new Date()
            : null;
      }

      if (
        req.body
          .ownerResponse !==
        undefined
      ) {
        if (
          typeof req.body
            .ownerResponse !==
          "string" ||
          req.body
            .ownerResponse
            .trim().length >
            1000
        ) {
          return next(
            new AppError(
              "Owner response must be valid text up to 1000 characters",
              400
            )
          );
        }

        request.ownerResponse =
          req.body
            .ownerResponse
            .trim() ||
          null;
      }

      await request.save();

      res.status(200).json({
        success: true,

        message:
          "Maintenance request updated successfully",

        data: {
          request,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Renter cancels pending request
|--------------------------------------------------------------------------
*/

exports.cancelMaintenanceRequest =
  asyncHandler(
    async (req, res, next) => {
      const request =
        await MaintenanceRequest.findOne({
          _id:
            req.params.id,

          renter:
            req.user._id,
        });

      if (!request) {
        return next(
          new AppError(
            "Maintenance request not found",
            404
          )
        );
      }

      if (
        request.status !==
        "pending"
      ) {
        return next(
          new AppError(
            "Only pending maintenance requests can be cancelled",
            400
          )
        );
      }

      request.status =
        "cancelled";

      request.cancelledAt =
        new Date();

      await request.save();

      res.status(200).json({
        success: true,

        message:
          "Maintenance request cancelled successfully",

        data: {
          request,
        },
      });
    }
  );