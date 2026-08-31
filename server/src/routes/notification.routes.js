const express = require("express");

const {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} = require(
  "../controllers/notification.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router = express.Router();

router.use(protect);

router.get(
  "/",
  getMyNotifications
);

router.get(
  "/unread-count",
  getUnreadCount
);

router.patch(
  "/read-all",
  markAllNotificationsRead
);

router.patch(
  "/:id/read",
  markNotificationRead
);

router.delete(
  "/:id",
  deleteNotification
);

module.exports = router;