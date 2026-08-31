const mongoose = require("mongoose");

const Review = require(
  "../models/review.model"
);

const Tenancy = require(
  "../models/tenancy.model"
);

const Property = require(
  "../models/property.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

/*
|--------------------------------------------------------------------------
| Create review
| POST /api/reviews/tenancy/:tenancyId
|--------------------------------------------------------------------------
*/

exports.createReview = asyncHandler(
  async (req, res, next) => {
    const { tenancyId } =
      req.params;

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

    const rating =
      Number(req.body.rating);

    if (
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5
    ) {
      return next(
        new AppError(
          "Rating must be an integer between 1 and 5",
          400
        )
      );
    }

    let comment = null;

    if (
      req.body.comment !==
      undefined
    ) {
      if (
        typeof req.body.comment !==
        "string"
      ) {
        return next(
          new AppError(
            "Comment must be a string",
            400
          )
        );
      }

      comment =
        req.body.comment.trim();

      if (
        comment.length > 1000
      ) {
        return next(
          new AppError(
            "Comment cannot exceed 1000 characters",
            400
          )
        );
      }

      if (!comment) {
        comment = null;
      }
    }

    const tenancy =
      await Tenancy.findById(
        tenancyId
      );

    if (!tenancy) {
      return next(
        new AppError(
          "Tenancy not found",
          404
        )
      );
    }

    const userId =
      req.user._id.toString();

    const isOwner =
      tenancy.owner.toString() ===
      userId;

    const isRenter =
      tenancy.renter.toString() ===
      userId;

    if (!isOwner && !isRenter) {
      return next(
        new AppError(
          "You are not authorized to review this tenancy",
          403
        )
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Reviews only after tenancy completion
    |--------------------------------------------------------------------------
    */

    if (
      tenancy.status !==
      "ended"
    ) {
      return next(
        new AppError(
          "Reviews can only be submitted after the tenancy has ended",
          400
        )
      );
    }

    const existingReview =
      await Review.findOne({
        tenancy:
          tenancy._id,

        reviewer:
          req.user._id,
      });

    if (existingReview) {
      return next(
        new AppError(
          "You have already reviewed this tenancy",
          409
        )
      );
    }

    const reviewerRole =
      isOwner
        ? "owner"
        : "renter";

    const reviewee =
      isOwner
        ? tenancy.renter
        : tenancy.owner;

    const review =
      await Review.create({
        tenancy:
          tenancy._id,

        property:
          tenancy.property,

        reviewer:
          req.user._id,

        reviewee,

        reviewerRole,

        rating,

        comment,
      });

    await review.populate([
      {
        path: "reviewer",
        select:
          "name avatar",
      },
      {
        path: "reviewee",
        select:
          "name avatar",
      },
      {
        path: "property",
        select:
          "title slug",
      },
    ]);

    res.status(201).json({
      success: true,

      message:
        "Review submitted successfully",

      data: {
        review,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Public property reviews
| GET /api/reviews/property/:propertyId
|--------------------------------------------------------------------------
|
| Only renter reviews represent the actual rental/property experience.
|--------------------------------------------------------------------------
*/

exports.getPropertyReviews =
  asyncHandler(
    async (req, res, next) => {
      const {
        propertyId,
      } = req.params;

      if (
        !mongoose.isValidObjectId(
          propertyId
        )
      ) {
        return next(
          new AppError(
            "Invalid property ID",
            400
          )
        );
      }

      const propertyExists =
        await Property.exists({
          _id: propertyId,

          isDeleted: {
            $ne: true,
          },
        });

      if (!propertyExists) {
        return next(
          new AppError(
            "Property not found",
            404
          )
        );
      }

      const reviews =
        await Review.find({
          property:
            propertyId,

          reviewerRole:
            "renter",
        })
          .populate({
            path: "reviewer",

            select:
              "name avatar",
          })
          .sort({
            createdAt: -1,
          })
          .lean();

      const count =
        reviews.length;

      const averageRating =
        count === 0
          ? 0
          : Number(
              (
                reviews.reduce(
                  (
                    total,
                    review
                  ) =>
                    total +
                    review.rating,
                  0
                ) / count
              ).toFixed(1)
            );

      res.status(200).json({
        success: true,

        data: {
          count,

          averageRating,

          reviews,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Reviews written by logged-in user
| GET /api/reviews/mine
|--------------------------------------------------------------------------
*/

exports.getMyReviews =
  asyncHandler(
    async (req, res) => {
      const reviews =
        await Review.find({
          reviewer:
            req.user._id,
        })
          .populate({
            path: "property",

            select:
              "title slug",
          })
          .populate({
            path: "reviewee",

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
            reviews.length,

          reviews,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Reviews received by logged-in user
| GET /api/reviews/received
|--------------------------------------------------------------------------
*/

exports.getReceivedReviews =
  asyncHandler(
    async (req, res) => {
      const reviews =
        await Review.find({
          reviewee:
            req.user._id,
        })
          .populate({
            path: "reviewer",

            select:
              "name avatar",
          })
          .populate({
            path: "property",

            select:
              "title slug",
          })
          .sort({
            createdAt: -1,
          });

      res.status(200).json({
        success: true,

        data: {
          count:
            reviews.length,

          reviews,
        },
      });
    }
  );