const mongoose =
  require("mongoose");

const Viewing =
  require(
    "../models/viewing.model"
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
| Request property viewing
| POST /api/viewings/:propertyId
|--------------------------------------------------------------------------
*/

exports.createViewingRequest =
  asyncHandler(
    async (req, res, next) => {
      /*
      |--------------------------------------------------------------------------
      | Validate property ID
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Find published property
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Owner cannot request viewing of own property
      |--------------------------------------------------------------------------
      */

      if (
        property.owner.toString() ===
        req.user._id.toString()
      ) {
        return next(
          new AppError(
            "You cannot request a viewing for your own property",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Validate requested date/time
      |--------------------------------------------------------------------------
      */

      if (
        !req.body
          .requestedDateTime
      ) {
        return next(
          new AppError(
            "Viewing date and time are required",
            400
          )
        );
      }

      const requestedDateTime =
        new Date(
          req.body
            .requestedDateTime
        );

      if (
        Number.isNaN(
          requestedDateTime
            .getTime()
        )
      ) {
        return next(
          new AppError(
            "Viewing date and time are invalid",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Viewing must be in the future
      |--------------------------------------------------------------------------
      */

      if (
        requestedDateTime <=
        new Date()
      ) {
        return next(
          new AppError(
            "Viewing date and time must be in the future",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent duplicate active viewing requests
      |--------------------------------------------------------------------------
      |
      | Renter can request another viewing later after:
      | rejected / cancelled / completed.
      |
      */

      const existingViewing =
        await Viewing.findOne({
          property:
            property._id,

          renter:
            req.user._id,

          status: {
            $in: [
              "requested",
              "confirmed",
            ],
          },
        });

      if (existingViewing) {
        return next(
          new AppError(
            "You already have an active viewing request for this property",
            409
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Validate optional message
      |--------------------------------------------------------------------------
      */

      const message =
        req.body.message
          ? req.body.message.trim()
          : "";

      if (
        message.length > 500
      ) {
        return next(
          new AppError(
            "Viewing message cannot exceed 500 characters",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Create viewing request
      |--------------------------------------------------------------------------
      */

      const viewing =
        await Viewing.create({
          property:
            property._id,

          renter:
            req.user._id,

          owner:
            property.owner,

          requestedDateTime,

          message,
        });

      await viewing.populate([
        {
          path: "property",

          select:
            "title slug monthlyRent propertyType address listingStatus",
        },

        {
          path: "renter",

          select:
            "name avatar",
        },

        {
          path: "owner",

          select:
            "name avatar",
        },
      ]);
await safeCreateNotification({
  user: property.owner,

  type: "viewing",

  title: "New Viewing Request",

  message:
    `${req.user.name} requested a viewing for ${property.title}.`,

  resourceType: "viewing",

  resourceId: viewing._id,
});

      res.status(201).json({
        success: true,

        message:
          "Viewing request submitted successfully",

        data: {
          viewing,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get logged-in renter's viewings
| GET /api/viewings/mine
|--------------------------------------------------------------------------
*/

exports.getMyViewings =
  asyncHandler(
    async (req, res) => {
      const viewings =
        await Viewing.find({
          renter:
            req.user._id,
        })
          .populate(
            "property",
            "title slug monthlyRent propertyType address listingStatus"
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
            viewings.length,

          viewings,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get viewings received by owner
| GET /api/viewings/received
|--------------------------------------------------------------------------
*/

exports.getReceivedViewings =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      const filter = {
        owner:
          req.user._id,
      };

      /*
      |--------------------------------------------------------------------------
      | Optional status filter
      |--------------------------------------------------------------------------
      */

      if (
        req.query.status
      ) {
        const allowedStatuses =
          [
            "requested",
            "confirmed",
            "rejected",
            "cancelled",
            "completed",
          ];

        if (
          !allowedStatuses.includes(
            req.query.status
          )
        ) {
          return next(
            new AppError(
              "Invalid viewing status",
              400
            )
          );
        }

        filter.status =
          req.query.status;
      }

      const viewings =
        await Viewing.find(
          filter
        )
          .populate(
            "property",
            "title slug monthlyRent propertyType address listingStatus"
          )
          .populate(
            "renter",
            "name email phone avatar"
          )
          .sort({
            requestedDateTime: 1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            viewings.length,

          viewings,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get viewings for owner's property
| GET /api/viewings/property/:propertyId
|--------------------------------------------------------------------------
*/

exports.getPropertyViewings =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
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

      const viewings =
        await Viewing.find({
          property:
            property._id,
        })
          .populate(
            "renter",
            "name email phone avatar"
          )
          .sort({
            requestedDateTime: 1,
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
            viewings.length,

          viewings,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Confirm viewing
| PATCH /api/viewings/:id/confirm
|--------------------------------------------------------------------------
*/

exports.confirmViewing =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid viewing ID",
            400
          )
        );
      }

      const viewing =
        await Viewing.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,
        });

      if (!viewing) {
        return next(
          new AppError(
            "Viewing request not found",
            404
          )
        );
      }

      if (
        viewing.status !==
        "requested"
      ) {
        return next(
          new AppError(
            "Only requested viewings can be confirmed",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Prevent confirming expired date
      |--------------------------------------------------------------------------
      */

      if (
        viewing
          .requestedDateTime <=
        new Date()
      ) {
        return next(
          new AppError(
            "This viewing time has already passed",
            400
          )
        );
      }

      const ownerResponse =
        req.body
          ?.ownerResponse
          ?.trim() || null;

      if (
        ownerResponse &&
        ownerResponse.length >
          500
      ) {
        return next(
          new AppError(
            "Owner response cannot exceed 500 characters",
            400
          )
        );
      }

      viewing.status =
        "confirmed";

      viewing.confirmedAt =
        new Date();

      viewing.ownerResponse =
        ownerResponse;

      await viewing.save();
      await safeCreateNotification({
  user: viewing.renter,

  type: "viewing_confirmed",

  title: "Viewing Confirmed",

  message:
    "Your property viewing request has been confirmed.",

  resourceType: "viewing",

  resourceId: viewing._id,
});

      await viewing.populate([
        {
          path: "property",

          select:
            "title slug address",
        },

        {
          path: "renter",

          select:
            "name email phone avatar",
        },
      ]);

      res.status(200).json({
        success: true,

        message:
          "Viewing confirmed successfully",

        data: {
          viewing,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Reject viewing
| PATCH /api/viewings/:id/reject
|--------------------------------------------------------------------------
*/

exports.rejectViewing =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid viewing ID",
            400
          )
        );
      }

      const viewing =
        await Viewing.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,
        });

      if (!viewing) {
        return next(
          new AppError(
            "Viewing request not found",
            404
          )
        );
      }

      if (
        viewing.status !==
        "requested"
      ) {
        return next(
          new AppError(
            "Only requested viewings can be rejected",
            400
          )
        );
      }

      const ownerResponse =
        req.body
          ?.ownerResponse
          ?.trim();

      if (
        ownerResponse &&
        ownerResponse.length >
          500
      ) {
        return next(
          new AppError(
            "Owner response cannot exceed 500 characters",
            400
          )
        );
      }

      viewing.status =
        "rejected";

      viewing.rejectedAt =
        new Date();

      viewing.ownerResponse =
        ownerResponse || null;

      await viewing.save();
      await safeCreateNotification({
  user: viewing.renter,

  type: "viewing_rejected",

  title: "Viewing Request Rejected",

  message: ownerResponse
    ? `Your viewing request was rejected. Reason: ${ownerResponse}`
    : "Your viewing request was rejected.",

  resourceType: "viewing",

  resourceId: viewing._id,
});

      res.status(200).json({
        success: true,

        message:
          "Viewing rejected successfully",

        data: {
          viewing,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Cancel own viewing
| PATCH /api/viewings/:id/cancel
|--------------------------------------------------------------------------
*/

exports.cancelViewing =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid viewing ID",
            400
          )
        );
      }

      const viewing =
        await Viewing.findOne({
          _id:
            req.params.id,

          renter:
            req.user._id,
        });

      if (!viewing) {
        return next(
          new AppError(
            "Viewing request not found",
            404
          )
        );
      }

      if (
        ![
          "requested",
          "confirmed",
        ].includes(
          viewing.status
        )
      ) {
        return next(
          new AppError(
            "This viewing can no longer be cancelled",
            400
          )
        );
      }

      viewing.status =
        "cancelled";

      viewing.cancelledAt =
        new Date();

      await viewing.save();
      await safeCreateNotification({
  user: viewing.owner,

  type: "viewing_cancelled",

  title: "Viewing Cancelled",

  message:
    `${req.user.name} cancelled their property viewing.`,

  resourceType: "viewing",

  resourceId: viewing._id,
});

      res.status(200).json({
        success: true,

        message:
          "Viewing cancelled successfully",

        data: {
          viewing,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Mark viewing completed
| PATCH /api/viewings/:id/complete
|--------------------------------------------------------------------------
*/

exports.completeViewing =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      if (
        !mongoose.isValidObjectId(
          req.params.id
        )
      ) {
        return next(
          new AppError(
            "Invalid viewing ID",
            400
          )
        );
      }

      const viewing =
        await Viewing.findOne({
          _id:
            req.params.id,

          owner:
            req.user._id,
        });

      if (!viewing) {
        return next(
          new AppError(
            "Viewing request not found",
            404
          )
        );
      }

      if (
        viewing.status !==
        "confirmed"
      ) {
        return next(
          new AppError(
            "Only confirmed viewings can be completed",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Do not complete before scheduled time
      |--------------------------------------------------------------------------
      */

      if (
        viewing
          .requestedDateTime >
        new Date()
      ) {
        return next(
          new AppError(
            "Viewing cannot be completed before its scheduled time",
            400
          )
        );
      }

      viewing.status =
        "completed";

      viewing.completedAt =
        new Date();

      await viewing.save();
      await safeCreateNotification({
  user: viewing.renter,

  type: "viewing",

  title: "Viewing Completed",

  message:
    "Your property viewing has been marked as completed.",

  resourceType: "viewing",

  resourceId: viewing._id,
});

      res.status(200).json({
        success: true,

        message:
          "Viewing marked as completed",

        data: {
          viewing,
        },
      });
    }
  );