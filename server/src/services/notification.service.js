const Notification = require(
  "../models/notification.model"
);

/*
|--------------------------------------------------------------------------
| Create notification
|--------------------------------------------------------------------------
|
| This is the strict version.
| If MongoDB fails, the error is allowed to propagate.
|--------------------------------------------------------------------------
*/

const createNotification =
  async ({
    user,
    type,
    title,
    message,
    resourceType = "system",
    resourceId = null,
  }) => {
    if (
      !user ||
      !type ||
      !title ||
      !message
    ) {
      return null;
    }

    // Messages often quote user text (a reason, a note). Trim to the
    // model's limits so a long quote can't make the notification fail
    // validation and silently disappear.
    const clip = (text, max) => {
      const value = String(text);
      return value.length > max ? `${value.slice(0, max - 1)}…` : value;
    };

    return Notification.create({
      user,
      type,
      title: clip(title, 150),
      message: clip(message, 500),
      resourceType,
      resourceId,
    });
  };

/*
|--------------------------------------------------------------------------
| Safe notification
|--------------------------------------------------------------------------
|
| Notifications are secondary side-effects.
|
| Example:
| A message may already be saved successfully.
| If notification creation then fails, the message endpoint should NOT
| incorrectly tell the client that sending the message failed.
|--------------------------------------------------------------------------
*/

const safeCreateNotification =
  async (payload) => {
    try {
      return await createNotification(
        payload
      );
    } catch (error) {
      console.error(
        "[Notification Error]",
        {
          type:
            payload?.type,
          user:
            payload?.user,
          resourceType:
            payload?.resourceType,
          resourceId:
            payload?.resourceId,
          error:
            error?.message,
        }
      );

      return null;
    }
  };

/*
|--------------------------------------------------------------------------
| Create several notifications safely
|--------------------------------------------------------------------------
*/

const safeCreateNotifications =
  async (notifications = []) => {
    if (
      !Array.isArray(
        notifications
      ) ||
      notifications.length === 0
    ) {
      return [];
    }

    return Promise.all(
      notifications.map(
        (notification) =>
          safeCreateNotification(
            notification
          )
      )
    );
  };

module.exports = {
  createNotification,
  safeCreateNotification,
  safeCreateNotifications,
};