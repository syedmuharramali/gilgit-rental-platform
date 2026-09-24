require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require(
  "../config/db"
);

const User = require(
  "../models/user.model"
);

/*
|--------------------------------------------------------------------------
| One-off migration
|--------------------------------------------------------------------------
|
| Email confirmation is now required before signing in. Accounts that were
| created before that rule existed have emailVerified = false and would be
| locked out through no fault of their own.
|
| Run this once, right after deploying the change:
|
|   npm run verify:existing-users
|
*/

const markExistingUsersVerified =
  async () => {
    try {
      await connectDB();

      const result =
        await User.updateMany(
          {
            emailVerified: {
              $ne: true,
            },

            /*
            | Accounts created before email confirmation existed were never
            | sent a link, so this field is missing on them. Anyone who
            | signed up since has it set and must confirm for themselves —
            | this keeps a re-run from waving new, unconfirmed signups in.
            */

            emailVerificationSentAt: null,
          },
          {
            $set: {
              emailVerified: true,
            },

            $unset: {
              emailVerificationTokenHash: "",
              emailVerificationExpires: "",
            },
          }
        );

      console.log(
        `${result.modifiedCount} existing account(s) marked as verified`
      );

      await mongoose.connection.close();

      process.exit(0);
    } catch (error) {
      console.error(
        "Migration failed:",
        error
      );

      await mongoose.connection.close();

      process.exit(1);
    }
  };

markExistingUsersVerified();
