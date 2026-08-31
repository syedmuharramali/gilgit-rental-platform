const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Conversation message history
|--------------------------------------------------------------------------
*/

messageSchema.index({
  conversation: 1,
  createdAt: -1,
});

/*
|--------------------------------------------------------------------------
| Unread message lookup
|--------------------------------------------------------------------------
*/

messageSchema.index({
  recipient: 1,
  isRead: 1,
  createdAt: -1,
});

const Message = mongoose.model(
  "Message",
  messageSchema
);

module.exports = Message;