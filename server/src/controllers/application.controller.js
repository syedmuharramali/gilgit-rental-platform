const mongoose =
  require("mongoose");
const {
  safeCreateNotification,
  safeCreateNotifications,
} = require(
  "../services/notification.service"
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

/*
|--------------------------------------------------------------------------
| Apply for property
| POST /api/applications/:propertyId
|--------------------------------------------------------------------------
*/

exports.createApplication =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.propertyId
        )
      ) {
        return next(
          new AppError(
            "Invalid property ID",
            400
          )
        );
      }

      const property =
        await Property.findOne({
          _id:
            req.params.propertyId,

          listingStatus:
            "published",

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property not found or unavailable",
            404
          )
        );
      }

      if (
        property.owner.toString() ===
        req.user._id.toString()
      ) {
        return next(
          new AppError(
            "You cannot apply to your own property",
            400
          )
        );
      }

      const existingApplication =
        await Application.findOne({
          property:
            property._id,

          applicant:
            req.user._id,
        });

      if (
        existingApplication
      ) {
        return next(
          new AppError(
            "You have already applied for this property",
            409
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Application type
      |--------------------------------------------------------------------------
      */

      const applicationType =
        req.body
          .applicationType ||
        "individual";

      if (
        ![
          "individual",
          "group",
        ].includes(
          applicationType
        )
      ) {
        return next(
          new AppError(
            "Application type must be individual or group",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Group / roommates
      |--------------------------------------------------------------------------
      */

      let roommates = [];

      if (
        applicationType ===
        "group"
      ) {
        if (
          !Array.isArray(
            req.body.roommates
          ) ||
          req.body
            .roommates
            .length === 0
        ) {
          return next(
            new AppError(
              "A group application requires at least one roommate",
              400
            )
          );
        }

        if (
          req.body
            .roommates
            .length > 9
        ) {
          return next(
            new AppError(
              "A group application may contain at most 9 additional roommates",
              400
            )
          );
        }

        roommates =
          req.body.roommates.map(
            (roommate) => {
              const name =
                typeof roommate
                  .name ===
                "string"
                  ? roommate
                      .name
                      .trim()
                  : "";

              const email =
                typeof roommate
                  .email ===
                "string"
                  ? roommate
                      .email
                      .trim()
                      .toLowerCase()
                  : "";

              const phone =
                typeof roommate
                  .phone ===
                "string"
                  ? roommate
                      .phone
                      .trim()
                  : null;

              if (
                name.length < 2 ||
                name.length > 80
              ) {
                throw new AppError(
                  "Each roommate requires a valid name",
                  400
                );
              }

              if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                  email
                )
              ) {
                throw new AppError(
                  `Invalid roommate email for ${name}`,
                  400
                );
              }

              return {
                name,
                email,
                phone:
                  phone || null,
              };
            }
          );

        const emails =
          roommates.map(
            (roommate) =>
              roommate.email
          );

        if (
          new Set(emails).size !==
          emails.length
        ) {
          return next(
            new AppError(
              "Roommate email addresses must be unique",
              400
            )
          );
        }

        if (
          req.user.email &&
          emails.includes(
            req.user.email
              .toLowerCase()
          )
        ) {
          return next(
            new AppError(
              "The lead applicant cannot also be listed as a roommate",
              400
            )
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Move-in date
      |--------------------------------------------------------------------------
      */

      let preferredMoveInDate =
        null;

      if (
        req.body
          .preferredMoveInDate
      ) {
        preferredMoveInDate =
          new Date(
            req.body
              .preferredMoveInDate
          );

        if (
          Number.isNaN(
            preferredMoveInDate
              .getTime()
          )
        ) {
          return next(
            new AppError(
              "Preferred move-in date is invalid",
              400
            )
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Expected stay
      |--------------------------------------------------------------------------
      */

      let expectedStayMonths =
        null;

      if (
        req.body
          .expectedStayMonths !==
        undefined
      ) {
        expectedStayMonths =
          Number(
            req.body
              .expectedStayMonths
          );

        if (
          !Number.isInteger(
            expectedStayMonths
          ) ||
          expectedStayMonths < 1 ||
          expectedStayMonths > 120
        ) {
          return next(
            new AppError(
              "Expected stay must be between 1 and 120 months",
              400
            )
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Occupancy
      |--------------------------------------------------------------------------
      */

      const occupants =
        applicationType ===
        "group"
          ? 1 +
            roommates.length
          : req.body
                .occupants !==
              undefined
            ? Number(
                req.body
                  .occupants
              )
            : 1;

      if (
        !Number.isInteger(
          occupants
        ) ||
        occupants < 1 ||
        occupants > 20
      ) {
        return next(
          new AppError(
            "Occupants must be between 1 and 20",
            400
          )
        );
      }

      if (
        occupants >
        property.maxOccupants
      ) {
        return next(
          new AppError(
            `This property allows a maximum of ${property.maxOccupants} occupant(s)`,
            400
          )
        );
      }

      const application =
        await Application.create({
          property:
            property._id,

          applicant:
            req.user._id,

          owner:
            property.owner,

          applicationType,

          roommates,

          message:
            req.body.message ||
            "",

          preferredMoveInDate,

          expectedStayMonths,

          occupants,
        });

      await application.populate([
        {
          path: "property",

          select:
            "title slug monthlyRent propertyType address listingStatus",
        },

        {
          path: "applicant",

          select:
            "name avatar",
        },
      ]);
      await safeCreateNotification({
  user: property.owner,

  type: "application",

  title: "New Rental Application",

  message:
    `${req.user.name} applied for ${property.title}.`,

  resourceType:
    "application",

  resourceId:
    application._id,
});

      res.status(201).json({
        success: true,

        message:
          applicationType ===
          "group"
            ? "Group rental application submitted successfully"
            : "Rental application submitted successfully",

        data: {
          application,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get logged-in user's applications
| GET /api/applications/mine
|--------------------------------------------------------------------------
*/

exports.getMyApplications =
  asyncHandler(
    async (req, res) => {
      const applications =
        await Application.find({
          applicant:
            req.user._id,
        })
          .populate(
            "property",
            "title slug monthlyRent propertyType address listingStatus images"
          )
          .populate(
            "owner",
            "name avatar"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            applications.length,

          applications,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get applications received by owner
| GET /api/applications/received
|--------------------------------------------------------------------------
*/

exports.getReceivedApplications =
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
          "accepted",
          "rejected",
          "withdrawn",
        ];

        if (
          !allowedStatuses.includes(
            req.query.status
          )
        ) {
          throw new AppError(
            "Invalid application status",
            400
          );
        }

        filter.status =
          req.query.status;
      }

      const applications =
        await Application.find(
          filter
        )
          .populate(
            "property",
            "title slug monthlyRent propertyType address listingStatus"
          )
          .populate(
            "applicant",
            "name email phone avatar"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            applications.length,

          applications,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get applications for one property
| GET /api/applications/property/:propertyId
|--------------------------------------------------------------------------
*/

exports.getPropertyApplications =
  asyncHandler(
    async (req, res, next) => {
      if (
        !mongoose.isValidObjectId(
          req.params.propertyId
        )
      ) {
        return next(
          new AppError(
            "Invalid property ID",
            400
          )
        );
      }

      const property =
        await Property.findOne({
          _id:
            req.params.propertyId,

          owner:
            req.user._id,

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property not found or you do not own this property",
            404
          )
        );
      }

      const applications =
        await Application.find({
          property:
            property._id,
        })
          .populate(
            "applicant",
            "name email phone avatar"
          )
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          property: {
            id:
              property._id,

            title:
              property.title,
          },

          count:
            applications.length,

          applications,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Accept application
| PATCH /api/applications/:id/accept
|--------------------------------------------------------------------------
*/

exports.acceptApplication =
  asyncHandler(
    async (req, res, next) => {
      const application =
        await Application.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,
        });

      if (!application) {
        return next(
          new AppError(
            "Application not found",
            404
          )
        );
      }

      if (
        application.status !==
        "pending"
      ) {
        return next(
          new AppError(
            "Only pending applications can be accepted",
            400
          )
        );
      }

      const property =
        await Property.findOne({
          _id:
            application.property,

          owner:
            req.user._id,

          listingStatus:
            "published",

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property is no longer available",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Find other pending applications before rejecting them
      |--------------------------------------------------------------------------
      */

      const otherPendingApplications =
        await Application.find({
          property:
            application.property,

          _id: {
            $ne:
              application._id,
          },

          status:
            "pending",
        }).select(
          "_id applicant"
        );

      /*
      |--------------------------------------------------------------------------
      | Accept selected application
      |--------------------------------------------------------------------------
      */

      application.status =
        "accepted";

      application.reviewedAt =
        new Date();

      application.rejectionReason =
        null;

      await application.save();

      /*
      |--------------------------------------------------------------------------
      | Reject other pending applications
      |--------------------------------------------------------------------------
      */

      await Application.updateMany(
        {
          property:
            application.property,

          _id: {
            $ne:
              application._id,
          },

          status:
            "pending",
        },
        {
          $set: {
            status:
              "rejected",

            reviewedAt:
              new Date(),

            rejectionReason:
              "Another application was accepted for this property",
          },
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Notify accepted applicant
      |--------------------------------------------------------------------------
      */

      await safeCreateNotification({
        user:
          application.applicant,

        type:
          "application_accepted",

        title:
          "Application Accepted",

        message:
          `Your application for ${property.title} has been accepted.`,

        resourceType:
          "application",

        resourceId:
          application._id,
      });

      /*
      |--------------------------------------------------------------------------
      | Notify automatically rejected applicants
      |--------------------------------------------------------------------------
      */

      await safeCreateNotifications(
        otherPendingApplications.map(
          (otherApplication) => ({
            user:
              otherApplication.applicant,

            type:
              "application_rejected",

            title:
              "Application Update",

            message:
              `Another application was accepted for ${property.title}.`,

            resourceType:
              "application",

            resourceId:
              otherApplication._id,
          })
        )
      );

      await application.populate([
        {
          path: "property",

          select:
            "title slug monthlyRent propertyType address",
        },

        {
          path: "applicant",

          select:
            "name email phone avatar",
        },
      ]);

      res.status(200).json({
        success: true,

        message:
          "Application accepted successfully",

        data: {
          application,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Reject application
| PATCH /api/applications/:id/reject
|--------------------------------------------------------------------------
*/

exports.rejectApplication =
  asyncHandler(
    async (req, res, next) => {
      const application =
        await Application.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,
        });

      if (!application) {
        return next(
          new AppError(
            "Application not found",
            404
          )
        );
      }

      if (
        application.status !==
        "pending"
      ) {
        return next(
          new AppError(
            "Only pending applications can be rejected",
            400
          )
        );
      }

      const reason =
        req.body.reason
          ?.trim();

      if (
        reason &&
        reason.length > 500
      ) {
        return next(
          new AppError(
            "Rejection reason cannot exceed 500 characters",
            400
          )
        );
      }

      application.status =
        "rejected";

      application.reviewedAt =
        new Date();

      application.rejectionReason =
        reason || null;

      await application.save();

      await safeCreateNotification({
        user:
          application.applicant,

        type:
          "application_rejected",

        title:
          "Application Rejected",

        message:
          reason
            ? `Your rental application was rejected. Reason: ${reason}`
            : "Your rental application was rejected.",

        resourceType:
          "application",

        resourceId:
          application._id,
      });

      res.status(200).json({
        success: true,

        message:
          "Application rejected successfully",

        data: {
          application,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Withdraw own application
| PATCH /api/applications/:id/withdraw
|--------------------------------------------------------------------------
*/

exports.withdrawApplication =
  asyncHandler(
    async (req, res, next) => {
      const application =
        await Application.findOne({
          _id:
            req.params.id,

          applicant:
            req.user._id,
        });

      if (!application) {
        return next(
          new AppError(
            "Application not found",
            404
          )
        );
      }

      if (
        application.status !==
        "pending"
      ) {
        return next(
          new AppError(
            "Only pending applications can be withdrawn",
            400
          )
        );
      }

      application.status =
        "withdrawn";

      application.withdrawnAt =
        new Date();

      await application.save();

      await safeCreateNotification({
        user:
          application.owner,

        type:
          "application_withdrawn",

        title:
          "Application Withdrawn",

        message:
          `${req.user.name} withdrew their rental application.`,

        resourceType:
          "application",

        resourceId:
          application._id,
      });

      res.status(200).json({
        success: true,

        message:
          "Application withdrawn successfully",

        data: {
          application,
        },
      });
    }
  );