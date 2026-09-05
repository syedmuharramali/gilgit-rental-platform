const mongoose =
  require("mongoose");

const RentRecord =
  require(
    "../models/rentRecord.model"
  );

const Tenancy =
  require(
    "../models/tenancy.model"
  );

const AppError =
  require("../utils/AppError");

const asyncHandler =
  require("../utils/asyncHandler");

const {
  safeCreateNotification,
} = require(
  "../services/notification.service"
);

/*
|--------------------------------------------------------------------------
| Safe monthly due date
|--------------------------------------------------------------------------
|
| Keeps the original due-day when possible and clamps to the last valid
| day of shorter months (for example Jan 31 -> Feb 28/29 -> Mar 31).
|
|--------------------------------------------------------------------------
*/

const getMonthlyDueDate = (
  startDate,
  monthOffset
) => {
  const targetMonth =
    new Date(
      Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth() +
          monthOffset,
        1
      )
    );

  const year =
    targetMonth.getUTCFullYear();

  const month =
    targetMonth.getUTCMonth();

  const originalDay =
    startDate.getUTCDate();

  const lastDayOfMonth =
    new Date(
      Date.UTC(
        year,
        month + 1,
        0
      )
    ).getUTCDate();

  const safeDay =
    Math.min(
      originalDay,
      lastDayOfMonth
    );

  return new Date(
    Date.UTC(
      year,
      month,
      safeDay
    )
  );
};

/*
|--------------------------------------------------------------------------
| Generate rent schedule
| POST /api/rent-ledger/tenancy/:tenancyId/generate
|--------------------------------------------------------------------------
*/

exports.generateRentSchedule =
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
        await Tenancy.findById(
          req.params.tenancyId
        );

      if (!tenancy) {
        return next(
          new AppError(
            "Tenancy not found",
            404
          )
        );
      }

      if (
        tenancy.owner.toString() !==
        req.user._id.toString()
      ) {
        return next(
          new AppError(
            "You are not authorized to generate rent records for this tenancy",
            403
          )
        );
      }

      if (
        tenancy.status !==
        "active"
      ) {
        return next(
          new AppError(
            "Rent schedule can only be generated for an active tenancy",
            400
          )
        );
      }

      const existingCount =
        await RentRecord.countDocuments({
          tenancy:
            tenancy._id,
        });

      if (
        existingCount > 0
      ) {
        return next(
          new AppError(
            "Rent schedule has already been generated for this tenancy",
            409
          )
        );
      }

      const records = [];

      const startDate =
        new Date(
          tenancy.startDate
        );

      for (
        let monthIndex = 0;
        monthIndex <
        tenancy.durationMonths;
        monthIndex++
      ) {
        const dueDate =
          getMonthlyDueDate(
            startDate,
            monthIndex
          );

        const year =
          dueDate.getUTCFullYear();

        const month =
          String(
            dueDate.getUTCMonth() +
              1
          ).padStart(
            2,
            "0"
          );

        records.push({
          tenancy:
            tenancy._id,

          property:
            tenancy.property,

          owner:
            tenancy.owner,

          renter:
            tenancy.renter,

          period:
            `${year}-${month}`,

          dueDate,

          amountDue:
            tenancy
              .agreedMonthlyRent,

          amountPaid: 0,

          status:
            "pending",
        });
      }

      const createdRecords =
        await RentRecord.insertMany(
          records
        );

      await safeCreateNotification({
        user:
          tenancy.renter,

        type:
          "rent",

        title:
          "Rent Schedule Created",

        message:
          `${createdRecords.length} monthly rent record(s) have been created for your tenancy.`,

        resourceType:
          "tenancy",

        resourceId:
          tenancy._id,
      });

      res.status(201).json({
        success: true,

        message:
          "Rent schedule generated successfully",

        data: {
          count:
            createdRecords.length,

          records:
            createdRecords,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get renter's rent records
| GET /api/rent-ledger/mine
|--------------------------------------------------------------------------
*/

exports.getMyRentRecords =
  asyncHandler(
    async (req, res) => {
      const records =
        await RentRecord.find({
          renter:
            req.user._id,
        })
          .populate(
            "property",
            "title slug address"
          )
          .populate(
            "owner",
            "name avatar"
          )
          .sort({
            dueDate: 1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            records.length,

          records,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get owner's rent records
| GET /api/rent-ledger/owned
|--------------------------------------------------------------------------
*/

exports.getOwnedRentRecords =
  asyncHandler(
    async (req, res) => {
      const filter = {
        owner:
          req.user._id,
      };

      if (
        req.query.status
      ) {
        const allowedStatuses = [
          "pending",
          "partial",
          "paid",
        ];

        if (
          !allowedStatuses.includes(
            req.query.status
          )
        ) {
          throw new AppError(
            "Invalid rent status",
            400
          );
        }

        filter.status =
          req.query.status;
      }

      const records =
        await RentRecord.find(
          filter
        )
          .populate(
            "property",
            "title slug address"
          )
          .populate(
            "renter",
            "name email phone avatar"
          )
          .sort({
            dueDate: 1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            records.length,

          records,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get rent records for one tenancy
| GET /api/rent-ledger/tenancy/:tenancyId
|--------------------------------------------------------------------------
*/

exports.getTenancyRentRecords =
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
        await Tenancy.findById(
          req.params.tenancyId
        );

      if (!tenancy) {
        return next(
          new AppError(
            "Tenancy not found",
            404
          )
        );
      }

      const isOwner =
        tenancy.owner.toString() ===
        req.user._id.toString();

      const isRenter =
        tenancy.renter.toString() ===
        req.user._id.toString();

      const isAdmin =
        req.user.role ===
        "admin";

      if (
        !isOwner &&
        !isRenter &&
        !isAdmin
      ) {
        return next(
          new AppError(
            "You are not authorized to view this rent ledger",
            403
          )
        );
      }

      const records =
        await RentRecord.find({
          tenancy:
            tenancy._id,
        }).sort({
          dueDate: 1,
        });

      res.status(200).json({
        success: true,

        data: {
          count:
            records.length,

          records,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Record payment
| PATCH /api/rent-ledger/:id/payment
|--------------------------------------------------------------------------
*/

exports.recordPayment =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid rent record ID",
            400
          )
        );
      }

      const record =
        await RentRecord.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,
        });

      if (!record) {
        return next(
          new AppError(
            "Rent record not found",
            404
          )
        );
      }

      const amount =
        Number(
          req.body.amount
        );

      if (
        Number.isNaN(amount) ||
        amount <= 0
      ) {
        return next(
          new AppError(
            "Payment amount must be greater than zero",
            400
          )
        );
      }

      if (
        record.amountPaid +
          amount >
        record.amountDue
      ) {
        return next(
          new AppError(
            "Payment cannot exceed the remaining rent amount",
            400
          )
        );
      }

      const notes =
        typeof req.body.notes ===
        "string"
          ? req.body.notes.trim()
          : null;

      if (
        notes &&
        notes.length > 500
      ) {
        return next(
          new AppError(
            "Payment notes cannot exceed 500 characters",
            400
          )
        );
      }

      record.amountPaid +=
        amount;

      record.recordedBy =
        req.user._id;

      record.notes =
        notes || null;

      if (
        record.amountPaid ===
        record.amountDue
      ) {
        record.status =
          "paid";

        record.paidAt =
          new Date();
      } else {
        record.status =
          "partial";

        record.paidAt =
          null;
      }

      await record.save();

      const remainingAmount =
        record.amountDue -
        record.amountPaid;

      await safeCreateNotification({
        user:
          record.renter,

        type:
          "rent",

        title:
          record.status ===
          "paid"
            ? "Rent Payment Recorded"
            : "Partial Rent Payment Recorded",

        message:
          record.status ===
          "paid"
            ? `Your rent payment for ${record.period} has been recorded as fully paid.`
            : `A payment of ${amount} has been recorded for ${record.period}. Remaining amount: ${remainingAmount}.`,

        resourceType:
          "rent_record",

        resourceId:
          record._id,
      });

      res.status(200).json({
        success: true,

        message:
          "Rent payment recorded successfully",

        data: {
          record,
        },
      });
    }
  );