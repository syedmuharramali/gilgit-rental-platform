const express = require(
  "express"
);

const {
  startConversation,
  startApplicationConversation,
  getMyConversations,
  getConversationMessages,
  sendMessage,
  markConversationRead,
} = require(
  "../controllers/messaging.controller"
);

const {
  protect,
} = require(
  "../middleware/auth.middleware"
);

const router =
  express.Router();

/*
|--------------------------------------------------------------------------
| All messaging routes require authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Conversations
|--------------------------------------------------------------------------
*/

router.get(
  "/conversations",
  getMyConversations
);

router.post(
  "/conversations/application/:applicationId",
  startApplicationConversation
);

router.post(
  "/conversations/:propertyId",
  startConversation
);

/*
|--------------------------------------------------------------------------
| Messages
|--------------------------------------------------------------------------
*/

router.get(
  "/conversations/:conversationId/messages",
  getConversationMessages
);

router.post(
  "/conversations/:conversationId/messages",
  sendMessage
);

router.patch(
  "/conversations/:conversationId/read",
  markConversationRead
);

module.exports = router;
