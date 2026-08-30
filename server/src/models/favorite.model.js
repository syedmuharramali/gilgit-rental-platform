const mongoose = require("mongoose");

const favoriteSchema =
  new mongoose.Schema(
    {
      user: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "User",
        required: true,
      },

      property: {
        type:
          mongoose.Schema.Types
            .ObjectId,
        ref: "Property",
        required: true,
      },
    },
    {
      timestamps: true,
    }
  );

/*
|--------------------------------------------------------------------------
| Prevent duplicate favorites
|--------------------------------------------------------------------------
*/

favoriteSchema.index(
  {
    user: 1,
    property: 1,
  },
  {
    unique: true,
  }
);

/*
|--------------------------------------------------------------------------
| User favorites
|--------------------------------------------------------------------------
*/

favoriteSchema.index({
  user: 1,
  createdAt: -1,
});

const Favorite =
  mongoose.model(
    "Favorite",
    favoriteSchema
  );

module.exports = Favorite;