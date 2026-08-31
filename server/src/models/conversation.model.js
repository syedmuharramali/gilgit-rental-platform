const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| One conversation per renter / owner / property
|--------------------------------------------------------------------------
*/

conversationSchema.index(
  {
    property: 1,
    owner: 1,
    renter: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| Conversation listing indexes
|--------------------------------------------------------------------------
*/

conversationSchema.index({
  owner: 1,
  lastMessageAt: -1,
});

conversationSchema.index({
  renter: 1,
  lastMessageAt: -1,
});

const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);

module.exports = Conversation;