const mongoose = require("mongoose");

const RentalAgreement = require(
  "../models/rentalAgreement.model"
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

const DEFAULT_CLAUSES = [
  "The renter shall pay the agreed monthly rent on time.",
  "The property shall be used only for residential purposes.",
  "The renter shall take reasonable care of the property.",
  "The owner shall respect the renter's lawful use and privacy of the rented property.",
  "Any property damage beyond normal wear and tear may be adjusted against the security deposit.",
  "Both parties shall communicate regarding termination or major tenancy changes.",
];

/*
|--------------------------------------------------------------------------
| Create agreement from active tenancy
| POST /api/agreements/tenancy/:tenancyId
|--------------------------------------------------------------------------
*/

exports.createAgreement =
  asyncHandler(
    async (req, res, next) => {
      const {
        tenancyId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(
          tenancyId
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
          _id: tenancyId,
          owner: req.user._id,
          status: "active",
        });

      if (!tenancy) {
        return next(
          new AppError(
            "Active tenancy not found or you are not its owner",
            404
          )
        );
      }

      const existing =
        await RentalAgreement.findOne({
          tenancy: tenancy._id,
        });

      if (existing) {
        return next(
          new AppError(
            "An agreement already exists for this tenancy",
            409
          )
        );
      }

      let clauses =
        DEFAULT_CLAUSES;

      if (
        req.body.clauses !==
        undefined
      ) {
        if (
          !Array.isArray(
            req.body.clauses
          )
        ) {
          return next(
            new AppError(
              "Clauses must be an array",
              400
            )
          );
        }

        if (
          req.body.clauses.length >
          20
        ) {
          return next(
            new AppError(
              "Agreement cannot contain more than 20 clauses",
              400
            )
          );
        }

        clauses =
          req.body.clauses.map(
            (clause) => {
              if (
                typeof clause !==
                "string"
              ) {
                throw new AppError(
                  "Every agreement clause must be text",
                  400
                );
              }

              const cleaned =
                clause.trim();

              if (
                !cleaned ||
                cleaned.length >
                  500
              ) {
                throw new AppError(
                  "Each clause must contain between 1 and 500 characters",
                  400
                );
              }

              return cleaned;
            }
          );
      }

      const agreement =
        await RentalAgreement.create({
          tenancy:
            tenancy._id,

          property:
            tenancy.property,

          owner:
            tenancy.owner,

          renter:
            tenancy.renter,

          startDate:
            tenancy.startDate,

          durationMonths:
            tenancy.durationMonths,

          monthlyRent:
            tenancy.agreedMonthlyRent,

          securityDeposit:
            tenancy.securityDeposit,

          clauses,

          createdBy:
            req.user._id,
        });

      await agreement.populate([
        {
          path: "property",
          select:
            "title slug address propertyType",
        },
        {
          path: "owner",
          select:
            "name email",
        },
        {
          path: "renter",
          select:
            "name email",
        },
      ]);

      res.status(201).json({
        success: true,

        message:
          "Rental agreement created successfully",

        data: {
          agreement,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| My agreements
| GET /api/agreements
|--------------------------------------------------------------------------
*/

exports.getMyAgreements =
  asyncHandler(
    async (req, res) => {
      const agreements =
        await RentalAgreement.find({
          $or: [
            {
              owner:
                req.user._id,
            },
            {
              renter:
                req.user._id,
            },
          ],
        })
          .populate(
            "property",
            "title slug address propertyType"
          )
          .populate(
            "owner",
            "name email"
          )
          .populate(
            "renter",
            "name email"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            agreements.length,

          agreements,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Single agreement
|--------------------------------------------------------------------------
*/

exports.getAgreementById =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid agreement ID",
            400
          )
        );
      }

      const agreement =
        await RentalAgreement.findById(
          req.params.id
        )
          .populate(
            "property",
            "title slug address propertyType"
          )
          .populate(
            "owner",
            "name email"
          )
          .populate(
            "renter",
            "name email"
          );

      if (!agreement) {
        return next(
          new AppError(
            "Rental agreement not found",
            404
          )
        );
      }

      const userId =
        req.user._id.toString();

      const isOwner =
        agreement.owner._id
          .toString() === userId;

      const isRenter =
        agreement.renter._id
          .toString() === userId;

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
            "You are not authorized to view this agreement",
            403
          )
        );
      }

      res.status(200).json({
        success: true,

        data: {
          agreement,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Electronically sign
| PATCH /api/agreements/:id/sign
|--------------------------------------------------------------------------
*/

exports.signAgreement =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid agreement ID",
            400
          )
        );
      }

      if (
        req.body.accepted !==
        true
      ) {
        return next(
          new AppError(
            "You must explicitly accept the agreement before signing",
            400
          )
        );
      }

      const legalName =
        typeof req.body
          .legalName ===
        "string"
          ? req.body.legalName.trim()
          : "";

      if (
        legalName.length < 2 ||
        legalName.length > 120
      ) {
        return next(
          new AppError(
            "A valid legal name is required",
            400
          )
        );
      }

      const agreement =
        await RentalAgreement.findById(
          req.params.id
        );

      if (!agreement) {
        return next(
          new AppError(
            "Rental agreement not found",
            404
          )
        );
      }

      if (
        agreement.status ===
        "cancelled"
      ) {
        return next(
          new AppError(
            "Cancelled agreements cannot be signed",
            400
          )
        );
      }

      const userId =
        req.user._id.toString();

      const isOwner =
        agreement.owner.toString() ===
        userId;

      const isRenter =
        agreement.renter.toString() ===
        userId;

      if (
        !isOwner &&
        !isRenter
      ) {
        return next(
          new AppError(
            "You are not a party to this agreement",
            403
          )
        );
      }

      const signature =
        isOwner
          ? agreement
              .ownerSignature
          : agreement
              .renterSignature;

      if (signature.signed) {
        return next(
          new AppError(
            "You have already signed this agreement",
            409
          )
        );
      }

      signature.signed = true;
      signature.legalName =
        legalName;
      signature.signedAt =
        new Date();

      if (
        agreement
          .ownerSignature
          .signed &&
        agreement
          .renterSignature
          .signed
      ) {
        agreement.status =
          "executed";

        agreement.executedAt =
          new Date();
      }

      await agreement.save();

      res.status(200).json({
        success: true,

        message:
          agreement.status ===
          "executed"
            ? "Agreement fully signed and executed"
            : "Agreement signed successfully",

        data: {
          agreement,
        },
      });
    }
  );