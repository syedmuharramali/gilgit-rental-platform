const Notification = require(
  "../models/notification.model"
);

/*
|--------------------------------------------------------------------------
| Create notification
|--------------------------------------------------------------------------
*/

const createNotification = async ({
  user,
  type,
  title,
  message,
  resourceType = "system",
  resourceId = null,
}) => {
  if (!user || !type || !title || !message) {
    return null;
  }

  return Notification.create({
    user,
    type,
    title,
    message,
    resourceType,
    resourceId,
  });
};

module.exports = {
  createNotification,
};