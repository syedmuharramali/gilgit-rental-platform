const mongoose = require("mongoose");

const {
  createNotification,
} = require(
  "../services/notification.service"
);

const Conversation = require(
  "../models/conversation.model"
);

const Message = require(
  "../models/message.model"
);

const Property = require(
  "../models/property.model"
);

const Tenancy = require(
  "../models/tenancy.model"
);

const AppError = require(
  "../utils/AppError"
);

const asyncHandler = require(
  "../utils/asyncHandler"
);

/*
|--------------------------------------------------------------------------
| Helper: validate conversation access
|--------------------------------------------------------------------------
*/

const getAuthorizedConversation = async (
  conversationId,
  userId
) => {
  if (
    !mongoose.isValidObjectId(
      conversationId
    )
  ) {
    throw new AppError(
      "Invalid conversation ID",
      400
    );
  }

  const conversation =
    await Conversation.findById(
      conversationId
    );

  if (!conversation) {
    throw new AppError(
      "Conversation not found",
      404
    );
  }

  const userIdString =
    userId.toString();

  const isOwner =
    conversation.owner.toString() ===
    userIdString;

  const isRenter =
    conversation.renter.toString() ===
    userIdString;

  if (!isOwner && !isRenter) {
    throw new AppError(
      "You are not authorized to access this conversation",
      403
    );
  }

  return conversation;
};

/*
|--------------------------------------------------------------------------
| Start / get conversation
| POST /api/messages/conversations/:propertyId
|--------------------------------------------------------------------------
|
| Published property:
| Any authenticated non-owner user may start conversation.
|
| Rented property:
| Only the active renter may start conversation.
|--------------------------------------------------------------------------
*/

exports.startConversation =
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

      const property =
        await Property.findOne({
          _id: propertyId,

          isDeleted: {
            $ne: true,
          },

          listingStatus: {
            $in: [
              "published",
              "rented",
            ],
          },
        }).select(
          "owner title slug listingStatus propertyType monthlyRent address"
        );

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
      | Property owner cannot start renter conversation with themselves
      |--------------------------------------------------------------------------
      */

      if (
        property.owner.toString() ===
        req.user._id.toString()
      ) {
        return next(
          new AppError(
            "You cannot start a conversation with yourself",
            400
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | If property is rented, only active renter may start conversation
      |--------------------------------------------------------------------------
      */

      if (
        property.listingStatus ===
        "rented"
      ) {
        const activeTenancy =
          await Tenancy.findOne({
            property:
              property._id,

            owner:
              property.owner,

            renter:
              req.user._id,

            status:
              "active",
          }).select("_id");

        if (!activeTenancy) {
          return next(
            new AppError(
              "Only the active renter can start a conversation for this rented property",
              403
            )
          );
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Return existing conversation if already created
      |--------------------------------------------------------------------------
      */

      let conversation =
        await Conversation.findOne({
          property:
            property._id,

          owner:
            property.owner,

          renter:
            req.user._id,
        });

      let created = false;

      if (!conversation) {
        try {
          conversation =
            await Conversation.create({
              property:
                property._id,

              owner:
                property.owner,

              renter:
                req.user._id,

              lastMessageAt:
                new Date(),
            });

          created = true;
        } catch (error) {
          /*
          |--------------------------------------------------------------------------
          | Protect against race condition from unique compound index
          |--------------------------------------------------------------------------
          */

          if (
            error &&
            error.code === 11000
          ) {
            conversation =
              await Conversation.findOne({
                property:
                  property._id,

                owner:
                  property.owner,

                renter:
                  req.user._id,
              });
          } else {
            throw error;
          }
        }
      }

      await conversation.populate([
        {
          path: "property",
          select:
            "title slug propertyType monthlyRent listingStatus address",
        },
        {
          path: "owner",
          select:
            "name avatar",
        },
        {
          path: "renter",
          select:
            "name avatar",
        },
        {
          path: "lastMessage",
          select:
            "body sender recipient isRead createdAt",
        },
      ]);

      res
        .status(
          created ? 201 : 200
        )
        .json({
          success: true,

          message: created
            ? "Conversation started successfully"
            : "Conversation already exists",

          data: {
            conversation,
          },
        });
    }
  );

/*
|--------------------------------------------------------------------------
| Get logged-in user's conversations
| GET /api/messages/conversations
|--------------------------------------------------------------------------
*/

exports.getMyConversations =
  asyncHandler(
    async (req, res) => {
      const userId =
        req.user._id;

      const conversations =
        await Conversation.find({
          $or: [
            {
              owner:
                userId,
            },
            {
              renter:
                userId,
            },
          ],
        })
          .populate({
            path: "property",

            select:
              "title slug propertyType monthlyRent listingStatus address images",
          })
          .populate({
            path: "owner",

            select:
              "name avatar",
          })
          .populate({
            path: "renter",

            select:
              "name avatar",
          })
          .populate({
            path: "lastMessage",

            select:
              "body sender recipient isRead createdAt",
          })
          .sort({
            lastMessageAt: -1,
          })
          .lean();

      if (
        conversations.length ===
        0
      ) {
        return res
          .status(200)
          .json({
            success: true,

            data: {
              count: 0,

              conversations: [],
            },
          });
      }

      /*
      |--------------------------------------------------------------------------
      | Get unread counts efficiently
      |--------------------------------------------------------------------------
      */

      const conversationIds =
        conversations.map(
          (conversation) =>
            conversation._id
        );

      const unreadResults =
        await Message.aggregate([
          {
            $match: {
              conversation: {
                $in:
                  conversationIds,
              },

              recipient:
                userId,

              isRead:
                false,
            },
          },

          {
            $group: {
              _id:
                "$conversation",

              count: {
                $sum: 1,
              },
            },
          },
        ]);

      const unreadMap =
        new Map();

      unreadResults.forEach(
        (result) => {
          unreadMap.set(
            result._id.toString(),
            result.count
          );
        }
      );

      const result =
        conversations.map(
          (conversation) => ({
            ...conversation,

            unreadCount:
              unreadMap.get(
                conversation._id.toString()
              ) || 0,
          })
        );

      res.status(200).json({
        success: true,

        data: {
          count:
            result.length,

          conversations:
            result,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Get messages in conversation
| GET /api/messages/conversations/:conversationId/messages
|--------------------------------------------------------------------------
*/

exports.getConversationMessages =
  asyncHandler(
    async (req, res) => {
      const conversation =
        await getAuthorizedConversation(
          req.params
            .conversationId,
          req.user._id
        );

      const page =
        Math.max(
          parseInt(
            req.query.page,
            10
          ) || 1,
          1
        );

      const requestedLimit =
        parseInt(
          req.query.limit,
          10
        ) || 30;

      const limit =
        Math.min(
          Math.max(
            requestedLimit,
            1
          ),
          100
        );

      const skip =
        (page - 1) *
        limit;

      const total =
        await Message.countDocuments({
          conversation:
            conversation._id,
        });

      /*
      |--------------------------------------------------------------------------
      | Query latest first for efficient pagination
      |--------------------------------------------------------------------------
      */

      let messages =
        await Message.find({
          conversation:
            conversation._id,
        })
          .populate({
            path: "sender",

            select:
              "name avatar",
          })
          .populate({
            path: "recipient",

            select:
              "name avatar",
          })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean();

      /*
      |--------------------------------------------------------------------------
      | Return messages chronologically within page
      |--------------------------------------------------------------------------
      */

      messages =
        messages.reverse();

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

          hasMore:
            skip +
              messages.length <
            total,

          messages,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Send message
| POST /api/messages/conversations/:conversationId/messages
|--------------------------------------------------------------------------
*/

exports.sendMessage =
  asyncHandler(
    async (req, res, next) => {
      const conversation =
        await getAuthorizedConversation(
          req.params
            .conversationId,
          req.user._id
        );

      const rawBody =
        req.body?.body;

      if (
        typeof rawBody !==
        "string"
      ) {
        return next(
          new AppError(
            "Message body is required",
            400
          )
        );
      }

      const body =
        rawBody.trim();

      if (!body) {
        return next(
          new AppError(
            "Message cannot be empty",
            400
          )
        );
      }

      if (
        body.length > 2000
      ) {
        return next(
          new AppError(
            "Message cannot exceed 2000 characters",
            400
          )
        );
      }

      const senderId =
        req.user._id;

      let recipientId;

      if (
        conversation.owner.toString() ===
        senderId.toString()
      ) {
        recipientId =
          conversation.renter;
      } else {
        recipientId =
          conversation.owner;
      }

      const message =
        await Message.create({
          conversation:
            conversation._id,

          sender:
            senderId,

          recipient:
            recipientId,

          body,
        });

      conversation.lastMessage =
        message._id;

      conversation.lastMessageAt =
        message.createdAt;

      await conversation.save();
      await createNotification({
  user: recipientId,

  type: "message",

  title: "New Message",

  message:
    `${req.user.name} sent you a message.`,

  resourceType:
    "conversation",

  resourceId:
    conversation._id,
});

      await message.populate([
        {
          path: "sender",

          select:
            "name avatar",
        },
        {
          path: "recipient",

          select:
            "name avatar",
        },
      ]);

      res.status(201).json({
        success: true,

        message:
          "Message sent successfully",

        data: {
          message,
        },
      });
    }
  );

/*
|--------------------------------------------------------------------------
| Mark conversation messages as read
| PATCH /api/messages/conversations/:conversationId/read
|--------------------------------------------------------------------------
*/

exports.markConversationRead =
  asyncHandler(
    async (req, res) => {
      const conversation =
        await getAuthorizedConversation(
          req.params
            .conversationId,
          req.user._id
        );

      const now =
        new Date();

      const result =
        await Message.updateMany(
          {
            conversation:
              conversation._id,

            recipient:
              req.user._id,

            isRead:
              false,
          },

          {
            $set: {
              isRead:
                true,

              readAt:
                now,
            },
          }
        );

      res.status(200).json({
        success: true,

        message:
          "Conversation marked as read",

        data: {
          updatedMessages:
            result.modifiedCount,
        },
      });
    }
  );