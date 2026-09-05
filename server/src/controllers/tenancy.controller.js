const mongoose =
  require("mongoose");

const Tenancy =
  require(
    "../models/tenancy.model"
  );

const Application =
  require(
    "../models/application.model"
  );

const Property =
  require(
    "../models/property.model"
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
| Create tenancy from accepted application
| POST /api/tenancies/from-application/:applicationId
|--------------------------------------------------------------------------
*/

exports.createTenancy =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.applicationId
        )
      ) {
        return next(
          new AppError(
            "Invalid application ID",
            400
          )
        );
      }

      const session =
        await mongoose.startSession();

      let tenancy;

      try {
        await session.withTransaction(
          async () => {
            /*
            |--------------------------------------------------------------------------
            | Accepted application must belong to owner
            |--------------------------------------------------------------------------
            */

            const application =
              await Application.findOne({
                _id:
                  req.params
                    .applicationId,

                owner:
                  req.user._id,

                status:
                  "accepted",
              }).session(session);

            if (!application) {
              throw new AppError(
                "Accepted application not found",
                404
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent duplicate tenancy
            |--------------------------------------------------------------------------
            */

            const existingTenancy =
              await Tenancy.findOne({
                application:
                  application._id,
              }).session(session);

            if (
              existingTenancy
            ) {
              throw new AppError(
                "A tenancy already exists for this application",
                409
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Property must still be available
            |--------------------------------------------------------------------------
            */

            const property =
              await Property.findOne({
                _id:
                  application
                    .property,

                owner:
                  req.user._id,

                listingStatus:
                  "published",

                isDeleted: {
                  $ne: true,
                },
              }).session(session);

            if (!property) {
              throw new AppError(
                "Property is no longer available for tenancy",
                400
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Start date
            |--------------------------------------------------------------------------
            */

            const startDateValue =
              req.body.startDate ||
              application
                .preferredMoveInDate ||
              new Date();

            const startDate =
              new Date(
                startDateValue
              );

            if (
              Number.isNaN(
                startDate.getTime()
              )
            ) {
              throw new AppError(
                "Invalid tenancy start date",
                400
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Duration
            |--------------------------------------------------------------------------
            */

            const durationMonths =
              req.body
                .durationMonths !==
              undefined
                ? Number(
                    req.body
                      .durationMonths
                  )
                : application
                    .expectedStayMonths ||
                  property
                    .minimumStayMonths;

            if (
              !Number.isInteger(
                durationMonths
              ) ||
              durationMonths < 1 ||
              durationMonths > 120
            ) {
              throw new AppError(
                "Tenancy duration must be between 1 and 120 months",
                400
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Agreed rent
            |--------------------------------------------------------------------------
            */

            const agreedMonthlyRent =
              req.body
                .agreedMonthlyRent !==
              undefined
                ? Number(
                    req.body
                      .agreedMonthlyRent
                  )
                : property
                    .monthlyRent;

            if (
              Number.isNaN(
                agreedMonthlyRent
              ) ||
              agreedMonthlyRent < 0
            ) {
              throw new AppError(
                "Agreed monthly rent must be a valid non-negative number",
                400
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Security deposit
            |--------------------------------------------------------------------------
            */

            const securityDeposit =
              req.body
                .securityDeposit !==
              undefined
                ? Number(
                    req.body
                      .securityDeposit
                  )
                : property
                    .securityDeposit;

            if (
              Number.isNaN(
                securityDeposit
              ) ||
              securityDeposit < 0
            ) {
              throw new AppError(
                "Security deposit must be a valid non-negative number",
                400
              );
            }

            /*
            |--------------------------------------------------------------------------
            | Create tenancy
            |--------------------------------------------------------------------------
            */

            const created =
              await Tenancy.create(
                [
                  {
                    application:
                      application._id,

                    property:
                      property._id,

                    owner:
                      property.owner,

                    renter:
                      application
                        .applicant,

                    startDate,

                    durationMonths,

                    agreedMonthlyRent,

                    securityDeposit,

                    status:
                      "active",
                  },
                ],
                {
                  session,
                }
              );

            tenancy =
              created[0];

            /*
            |--------------------------------------------------------------------------
            | Property is now rented
            |--------------------------------------------------------------------------
            */

            property.listingStatus =
              "rented";

            property.publishedAt =
              null;

            await property.save({
              session,
            });
          }
        );
      } finally {
        await session.endSession();
      }

      await tenancy.populate([
        {
          path: "property",

          select:
            "title slug monthlyRent propertyType address listingStatus",
        },

        {
          path: "renter",

          select:
            "name email phone avatar",
        },

        {
          path: "owner",

          select:
            "name email phone avatar",
        },

        {
          path: "application",

          select:
            "status preferredMoveInDate expectedStayMonths occupants",
        },
      ]);
      await safeCreateNotification({
  user: tenancy.renter._id,

  type: "tenancy",

  title: "Tenancy Started",

  message:
    `Your tenancy for ${tenancy.property.title} has been created.`,

  resourceType: "tenancy",

  resourceId: tenancy._id,
});

      res.status(201).json({
        success: true,

        message:
          "Tenancy created successfully",

        data: {
          tenancy,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Renter's tenancies
| GET /api/tenancies/mine
|--------------------------------------------------------------------------
*/

exports.getMyTenancies =
  asyncHandler(
    async (req, res) => {
      const tenancies =
        await Tenancy.find({
          renter:
            req.user._id,
        })
          .populate(
            "property",
            "title slug propertyType address listingStatus"
          )
          .populate(
            "owner",
            "name email phone avatar"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            tenancies.length,

          tenancies,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Owner's tenancies
| GET /api/tenancies/owned
|--------------------------------------------------------------------------
*/

exports.getOwnedTenancies =
  asyncHandler(
    async (req, res) => {
      const tenancies =
        await Tenancy.find({
          owner:
            req.user._id,
        })
          .populate(
            "property",
            "title slug propertyType address listingStatus"
          )
          .populate(
            "renter",
            "name email phone avatar"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            tenancies.length,

          tenancies,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get single tenancy
| GET /api/tenancies/:id
|--------------------------------------------------------------------------
*/

exports.getTenancyById =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
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
          req.params.id
        )
          .populate(
            "property",
            "title slug propertyType address listingStatus"
          )
          .populate(
            "renter",
            "name email phone avatar"
          )
          .populate(
            "owner",
            "name email phone avatar"
          )
          .populate(
            "application"
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
        tenancy.owner._id
          .toString() ===
        req.user._id.toString();

      const isRenter =
        tenancy.renter._id
          .toString() ===
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
            "You are not authorized to view this tenancy",
            403
          )
        );
      }

      res.status(200).json({
        success: true,

        data: {
          tenancy,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| End tenancy
| PATCH /api/tenancies/:id/end
|--------------------------------------------------------------------------
*/

exports.endTenancy =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid tenancy ID",
            400
          )
        );
      }

      const reason =
        req.body
          ?.reason
          ?.trim() || null;

      if (
        reason &&
        reason.length > 500
      ) {
        return next(
          new AppError(
            "End reason cannot exceed 500 characters",
            400
          )
        );
      }

      const session =
        await mongoose.startSession();

      let tenancy;

      try {
        await session.withTransaction(
          async () => {
            tenancy =
              await Tenancy.findOne({
                _id:
                  req.params.id,

                owner:
                  req.user._id,

                status:
                  "active",
              }).session(session);

            if (!tenancy) {
              throw new AppError(
                "Active tenancy not found",
                404
              );
            }

            const property =
              await Property.findById(
                tenancy.property
              ).session(session);

            tenancy.status =
              "ended";

            tenancy.endedAt =
              new Date();

            tenancy.endReason =
              reason;

            await tenancy.save({
              session,
            });

            /*
            |--------------------------------------------------------------------------
            | Return property to draft
            |--------------------------------------------------------------------------
            |
            | Owner can update availability/details and submit it again.
            |
            */

            if (property) {
              property.listingStatus =
                "draft";

              property.publishedAt =
                null;

              property.submittedAt =
                null;

              property.reviewedAt =
                null;

              property.reviewedBy =
                null;

              property.rejectionReason =
                null;

              await property.save({
                session,
              });
            }
          }
        );
      } finally {
        await session.endSession();
      }
      await safeCreateNotification({
  user: tenancy.renter,

  type: "tenancy_ended",

  title: "Tenancy Ended",

  message: reason
    ? `Your tenancy has been ended. Reason: ${reason}`
    : "Your tenancy has been ended.",

  resourceType: "tenancy",

  resourceId: tenancy._id,
});

      res.status(200).json({
        success: true,

        message:
          "Tenancy ended successfully",

        data: {
          tenancy,
        },
      });
    }
  );