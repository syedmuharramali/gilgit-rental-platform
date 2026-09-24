const crypto = require("node:crypto");

const User = require("../models/user.model");
const AppError = require("../utils/AppError.js");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const {
  normalizeEmail,
  getEmailLookupCandidates,
} = require("../utils/email");
const {
  verifyGoogleCredential,
  isGoogleAuthoritativeEmail,
} = require("../services/googleAuth.service");

const {
  sendVerificationEmail,
} = require("../services/mail.service");

/*
|--------------------------------------------------------------------------
| Email verification helpers
|--------------------------------------------------------------------------
*/

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const buildVerifyUrl = (token) => {
  const base = (
    process.env.CLIENT_URL || "http://localhost:5173"
  ).replace(/\/$/, "");

  return `${base}/verify-email?token=${token}`;
};

/*
| Issues a fresh token, saves its hash on the user and emails the link.
| Returns whether the mail actually went out so the caller can be honest
| with the user instead of silently pretending it was sent.
*/

const issueVerificationEmail = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");

  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpires = new Date(
    Date.now() + VERIFICATION_TTL_MS
  );
  user.emailVerificationSentAt = new Date();

  await user.save({ validateBeforeSave: false });

  const result = await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verifyUrl: buildVerifyUrl(token),
  });

  return result;
};

const formatAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  emailVerified: user.emailVerified,
  phoneVerified: user.phoneVerified,
  accountStatus: user.accountStatus,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

/*
|--------------------------------------------------------------------------
| Find a user by email (exact match first, then legacy Gmail form)
|--------------------------------------------------------------------------
*/

const findUserByEmail = async (email, select) => {
  const candidates = getEmailLookupCandidates(email);

  let query = User.find({
    email: { $in: candidates },
  });

  if (select) {
    query = query.select(select);
  }

  const users = await query;

  return (
    users.find((user) => user.email === candidates[0]) ||
    users[0] ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Register
| POST /api/auth/register
|--------------------------------------------------------------------------
*/

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const normalizedEmail = normalizeEmail(email);

  const existingUser = await findUserByEmail(
    normalizedEmail,
    "+emailVerificationSentAt"
  );

  /*
  | An account that was never confirmed does not belong to anyone yet. If it
  | were kept, a typo'd or forgotten signup (or someone squatting on another
  | person's address) would block that address forever, because there is no
  | password reset. Registering again replaces the unconfirmed details and
  | sends a fresh link; only whoever controls the inbox can finish it.
  */

  const isUnclaimed =
    existingUser &&
    !existingUser.emailVerified &&
    !existingUser.googleId &&
    existingUser.authProvider === "local";

  if (existingUser && !isUnclaimed) {
    return next(
      new AppError("An account with this email already exists", 409)
    );
  }

  let user;

  if (isUnclaimed) {
    const lastSentAt = existingUser.emailVerificationSentAt;

    if (
      lastSentAt &&
      Date.now() - lastSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      return next(
        new AppError(
          "A confirmation email was just sent to this address. Please wait a minute before trying again.",
          429
        )
      );
    }

    existingUser.name = name;
    existingUser.password = password;
    await existingUser.save();

    user = existingUser;
  } else {
    user = await User.create({
      name,
      email: normalizedEmail,
      password,
      authProvider: "local",
    });
  }

  const delivery = await issueVerificationEmail(user);

  res.status(201).json({
    success: true,

    message: delivery.sent
      ? "Account created. Check your inbox for the confirmation link."
      : "Account created, but the confirmation email could not be sent. Use the resend button in a moment.",

    data: {
      emailSent: delivery.sent,
      email: user.email,
      user: formatAuthUser(user),
    },
  });
});

/*
|--------------------------------------------------------------------------
| Login
| POST /api/auth/login
|--------------------------------------------------------------------------
*/

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const normalizedEmail = normalizeEmail(email);

  const user = await findUserByEmail(normalizedEmail, "+password");

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  if (!user.password) {
    return next(
      new AppError(
        "This account uses Google Sign-In. Please continue with Google.",
        400
      )
    );
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    return next(new AppError("Invalid email or password", 401));
  }

  /*
  | Local accounts must confirm their email address before signing in.
  | Google accounts arrive already verified by Google.
  */

  if (!user.emailVerified) {
    const verificationError = new AppError(
      "Confirm your email address before signing in. Check your inbox for the link.",
      403
    );

    verificationError.code = "EMAIL_NOT_VERIFIED";

    return next(verificationError);
  }

  if (user.accountStatus !== "active") {
    return next(
      new AppError(
        `Your account is currently ${user.accountStatus}`,
        403
      )
    );
  }

  user.lastLoginAt = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Login successful",

    data: {
      token,
      user: formatAuthUser(user),
    },
  });
});

/*
|--------------------------------------------------------------------------
| Google Sign-In
| POST /api/auth/google
|--------------------------------------------------------------------------
|
| The frontend obtains a Google Identity Services ID token and sends it as
| `credential`. The backend verifies its signature, issuer, audience,
| expiration, and verified-email claim before creating/linking a user.
|--------------------------------------------------------------------------
*/

exports.googleLogin = asyncHandler(async (req, res, next) => {
  const googleProfile = await verifyGoogleCredential(
    req.body.credential
  );

  let user = await User.findOne({
    googleId: googleProfile.googleId,
  });

  if (!user) {
    const existingEmailUser = await findUserByEmail(googleProfile.email);

    if (existingEmailUser) {
      if (
        existingEmailUser.googleId &&
        existingEmailUser.googleId !== googleProfile.googleId
      ) {
        return next(
          new AppError(
            "This email is already linked to another Google account",
            409
          )
        );
      }

      if (!isGoogleAuthoritativeEmail(googleProfile)) {
        return next(
          new AppError(
            "An account with this email already exists. Sign in with your existing method before linking Google.",
            409
          )
        );
      }

      /*
      | If nobody ever proved they own this inbox, the password on the account
      | was chosen by whoever registered first — possibly not the person now
      | signing in with Google. Drop it, so it cannot be used to get in.
      */

      if (!existingEmailUser.emailVerified) {
        existingEmailUser.password = undefined;
        existingEmailUser.authProvider = "google";
        existingEmailUser.emailVerificationTokenHash = null;
        existingEmailUser.emailVerificationExpires = null;
      }

      existingEmailUser.googleId = googleProfile.googleId;
      existingEmailUser.emailVerified = true;

      if (
        !existingEmailUser.avatar?.url &&
        googleProfile.picture
      ) {
        existingEmailUser.avatar = {
          url: googleProfile.picture,
          publicId: null,
        };
      }

      user = existingEmailUser;
    } else {
      const fallbackName = googleProfile.email
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .trim();

      const name =
        googleProfile.name.length >= 2
          ? googleProfile.name
          : fallbackName.length >= 2
            ? fallbackName
            : "Google User";

      user = new User({
        name,
        email: googleProfile.email,
        googleId: googleProfile.googleId,
        authProvider: "google",
        emailVerified: true,
        avatar: {
          url: googleProfile.picture,
          publicId: null,
        },
      });
    }
  }

  if (user.accountStatus !== "active") {
    return next(
      new AppError(
        `Your account is currently ${user.accountStatus}`,
        403
      )
    );
  }

  user.lastLoginAt = new Date();

  await user.save({
    validateBeforeSave: false,
  });

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Google sign-in successful",

    data: {
      token,
      user: formatAuthUser(user),
    },
  });
});

/*
|--------------------------------------------------------------------------
| Confirm email address
| POST /api/auth/verify-email
|--------------------------------------------------------------------------
*/

exports.verifyEmail = asyncHandler(async (req, res, next) => {
  const token =
    typeof req.body.token === "string" ? req.body.token.trim() : "";

  if (!token) {
    return next(
      new AppError("The confirmation link is incomplete", 400)
    );
  }

  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
  }).select(
    "+emailVerificationTokenHash +emailVerificationExpires"
  );

  if (!user) {
    return next(
      new AppError(
        "This confirmation link is invalid or has already been used",
        400
      )
    );
  }

  if (
    user.emailVerificationExpires &&
    user.emailVerificationExpires.getTime() < Date.now()
  ) {
    return next(
      new AppError(
        "This confirmation link has expired. Request a new one.",
        400
      )
    );
  }

  if (user.accountStatus !== "active") {
    return next(
      new AppError(
        `Your account is currently ${user.accountStatus}`,
        403
      )
    );
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpires = null;
  user.lastLoginAt = new Date();

  await user.save({ validateBeforeSave: false });

  const authToken = generateToken(user._id);

  res.status(200).json({
    success: true,
    message: "Email confirmed successfully",

    data: {
      token: authToken,
      user: formatAuthUser(user),
    },
  });
});

/*
|--------------------------------------------------------------------------
| Resend the confirmation email
| POST /api/auth/resend-verification
|--------------------------------------------------------------------------
|
| Always answers the same way, so this cannot be used to discover which
| email addresses have accounts.
|
*/

exports.resendVerification = asyncHandler(async (req, res) => {
  const normalizedEmail = normalizeEmail(req.body.email);

  const genericResponse = {
    success: true,
    message:
      "If that address still needs confirming, a new link is on its way.",
  };

  const user = await findUserByEmail(
    normalizedEmail,
    "+emailVerificationSentAt"
  );

  if (!user || user.emailVerified) {
    return res.status(200).json(genericResponse);
  }

  const lastSentAt = user.emailVerificationSentAt;

  if (
    lastSentAt &&
    Date.now() - lastSentAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    return res.status(200).json(genericResponse);
  }

  /*
  | Answer before the SMTP round trip, otherwise the response time alone
  | would reveal which addresses have an unconfirmed account.
  */

  res.status(200).json(genericResponse);

  issueVerificationEmail(user).catch((error) => {
    console.error("Resend verification failed:", error.message);
  });
});

/*
|--------------------------------------------------------------------------
| Current user
| GET /api/auth/me
|--------------------------------------------------------------------------
*/

exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,

    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        avatar: req.user.avatar,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
        phoneVerified: req.user.phoneVerified,
        accountStatus: req.user.accountStatus,
        createdAt: req.user.createdAt,
      },
    },
  });
});

/*
|--------------------------------------------------------------------------
| Update current user profile
| PATCH /api/auth/me
|--------------------------------------------------------------------------
*/

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  if (name !== undefined) {
    req.user.name = name.trim();
  }

  if (phone !== undefined) {
    const nextPhone = phone?.trim() || null;

    if (nextPhone !== req.user.phone) {
      req.user.phone = nextPhone;
      req.user.phoneVerified = false;
    }
  }

  await req.user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: formatAuthUser(req.user),
    },
  });
});
