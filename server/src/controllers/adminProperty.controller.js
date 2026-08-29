const Property = require(
  "../models/property.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

const {
  getPublicFileViewUrl,
} = require(
  "../services/storage.service"
);

/*
|--------------------------------------------------------------------------
| Format property images
|--------------------------------------------------------------------------
*/

const formatImages = (images = []) => {
  return [...images]
    .sort(
      (a, b) =>
        a.order - b.order
    )
    .map((image) => ({
      id:
        image._id,

      fileId:
        image.fileId,

      name:
        image.name,

      mimeType:
        image.mimeType,

      size:
        image.size,

      alt:
        image.alt,

      isCover:
        image.isCover,

      order:
        image.order,

      url:
        getPublicFileViewUrl(
          image.fileId
        ),
    }));
};

/*
|--------------------------------------------------------------------------
| Get properties awaiting review
| GET /api/admin/properties
|--------------------------------------------------------------------------
*/

exports.getPropertiesForReview =
  asyncHandler(
    async (req, res) => {
      const page =
        Math.max(
          Number(req.query.page) ||
            1,
          1
        );

      const limit =
        Math.min(
          Math.max(
            Number(
              req.query.limit
            ) || 20,
            1
          ),
          100
        );

      const status =
        req.query.status ||
        "pending_review";

      const allowedStatuses = [
        "pending_review",
        "published",
        "rejected",
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        throw new AppError(
          "Invalid property review status",
          400
        );
      }

      const filter = {
        listingStatus: status,

        isDeleted: {
          $ne: true,
        },
      };

      const [
        properties,
        total,
      ] =
        await Promise.all([
          Property.find(
            filter
          )
            .populate(
              "owner",
              "name email phone avatar"
            )
            .populate(
              "amenities",
              "name slug category icon"
            )
            .sort({
              submittedAt: 1,
            })
            .skip(
              (page - 1) *
                limit
            )
            .limit(limit),

          Property.countDocuments(
            filter
          ),
        ]);

      const formatted =
        properties.map(
          (property) => {
            const object =
              property.toObject();

            object.images =
              formatImages(
                property.images
              );

            return object;
          }
        );

      res.status(200).json({
        success: true,

        data: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),

          properties:
            formatted,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get one property for admin review
| GET /api/admin/properties/:id
|--------------------------------------------------------------------------
*/

exports.getPropertyForReview =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      const property =
        await Property.findOne({
          _id:
            req.params.id,

          isDeleted: {
            $ne: true,
          },
        })
          .populate(
            "owner",
            "name email phone avatar"
          )
          .populate(
            "amenities",
            "name slug category icon"
          )
          .populate(
            "reviewedBy",
            "name email"
          );

      if (!property) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      const result =
        property.toObject();

      result.images =
        formatImages(
          property.images
        );

      res.status(200).json({
        success: true,

        data: {
          property:
            result,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Approve property
| PATCH /api/admin/properties/:id/approve
|--------------------------------------------------------------------------
*/

exports.approveProperty =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      const property =
        await Property.findOne({
          _id:
            req.params.id,

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      if (
        property.listingStatus !==
        "pending_review"
      ) {
        return next(
          new AppError(
            "Only properties pending review can be approved",
            400
          )
        );
      }

      property.listingStatus =
        "published";

      property.reviewedAt =
        new Date();

      property.reviewedBy =
        req.user._id;

      property.publishedAt =
        new Date();

      property.rejectionReason =
        null;

      await property.save();

      res.status(200).json({
        success: true,

        message:
          "Property approved and published successfully",

        data: {
          property,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Reject property
| PATCH /api/admin/properties/:id/reject
|--------------------------------------------------------------------------
*/

exports.rejectProperty =
  asyncHandler(
    async (
      req,
      res,
      next
    ) => {
      const reason =
        req.body?.reason?.trim();

      if (!reason) {
        return next(
          new AppError(
            "Rejection reason is required",
            400
          )
        );
      }

      if (
        reason.length > 500
      ) {
        return next(
          new AppError(
            "Rejection reason cannot exceed 500 characters",
            400
          )
        );
      }

      const property =
        await Property.findOne({
          _id:
            req.params.id,

          isDeleted: {
            $ne: true,
          },
        });

      if (!property) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      if (
        property.listingStatus !==
        "pending_review"
      ) {
        return next(
          new AppError(
            "Only properties pending review can be rejected",
            400
          )
        );
      }

      property.listingStatus =
        "rejected";

      property.reviewedAt =
        new Date();

      property.reviewedBy =
        req.user._id;

      property.rejectionReason =
        reason;

      property.publishedAt =
        null;

      await property.save();

      res.status(200).json({
        success: true,

        message:
          "Property rejected successfully",

        data: {
          property,
        },
      });
    }
  );