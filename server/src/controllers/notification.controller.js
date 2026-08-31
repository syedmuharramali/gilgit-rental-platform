const mongoose = require("mongoose");

const Notification = require(
  "../models/notification.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

/*
|--------------------------------------------------------------------------
| Get my notifications
| GET /api/notifications
|--------------------------------------------------------------------------
*/

exports.getMyNotifications = asyncHandler(
  async (req, res) => {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const requestedLimit =
      parseInt(req.query.limit, 10) || 20;

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      50
    );

    const skip =
      (page - 1) * limit;

    const filter = {
      user: req.user._id,
    };

    if (
      req.query.unread === "true"
    ) {
      filter.isRead = false;
    }

    const total =
      await Notification.countDocuments(
        filter
      );

    const notifications =
      await Notification.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
      success: true,

      data: {
        page,
        limit,
        total,

        totalPages:
          Math.ceil(total / limit),

        notifications,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Get unread count
| GET /api/notifications/unread-count
|--------------------------------------------------------------------------
*/

exports.getUnreadCount = asyncHandler(
  async (req, res) => {
    const count =
      await Notification.countDocuments({
        user: req.user._id,
        isRead: false,
      });

    res.status(200).json({
      success: true,

      data: {
        unreadCount: count,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Mark one notification read
| PATCH /api/notifications/:id/read
|--------------------------------------------------------------------------
*/

exports.markNotificationRead = asyncHandler(
  async (req, res, next) => {
    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return next(
        new AppError(
          "Invalid notification ID",
          400
        )
      );
    }

    const notification =
      await Notification.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!notification) {
      return next(
        new AppError(
          "Notification not found",
          404
        )
      );
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt =
        new Date();

      await notification.save();
    }

    res.status(200).json({
      success: true,

      message:
        "Notification marked as read",

      data: {
        notification,
      },
    });
  }
);

/*
|--------------------------------------------------------------------------
| Mark all notifications read
| PATCH /api/notifications/read-all
|--------------------------------------------------------------------------
*/

exports.markAllNotificationsRead =
  asyncHandler(
    async (req, res) => {
      const now = new Date();

      const result =
        await Notification.updateMany(
          {
            user: req.user._id,
            isRead: false,
          },
          {
            $set: {
              isRead: true,
              readAt: now,
            },
          }
        );

      res.status(200).json({
        success: true,

        message:
          "All notifications marked as read",

        data: {
          updatedNotifications:
            result.modifiedCount,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Delete one notification
| DELETE /api/notifications/:id
|--------------------------------------------------------------------------
*/

exports.deleteNotification = asyncHandler(
  async (req, res, next) => {
    if (
      !mongoose.isValidObjectId(
        req.params.id
      )
    ) {
      return next(
        new AppError(
          "Invalid notification ID",
          400
        )
      );
    }

    const notification =
      await Notification.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

    if (!notification) {
      return next(
        new AppError(
          "Notification not found",
          404
        )
      );
    }

    res.status(200).json({
      success: true,

      message:
        "Notification deleted successfully",
    });
  }
);