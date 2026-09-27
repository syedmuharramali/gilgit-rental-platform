const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "DB_NAME",
  "JWT_SECRET",
  "GOOGLE_CLIENT_ID",
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_BUCKET_ID",
];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(
    (name) =>
      !process.env[name] ||
      !process.env[name].trim()
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(
        ", "
      )}`
    );
  }

  if (
    process.env.JWT_SECRET.length <
    32
  ) {
    throw new Error(
      "JWT_SECRET must contain at least 32 characters"
    );
  }

  /*
  | Production needs the site's address (CORS and the email links use it)
  | and a way to send the confirmation emails, or nobody can sign up.
  */
  if (process.env.NODE_ENV === "production") {
    const siteUrls = [
      process.env.CLIENT_URL,
      ...(process.env.CLIENT_URLS || "").split(","),
    ]
      .map((value) => (value || "").trim())
      .filter(Boolean);

    if (siteUrls.length === 0) {
      throw new Error(
        "CLIENT_URL must be set in production to the website address, e.g. https://fyp.syedmuharramali.com"
      );
    }

    for (const value of siteUrls) {
      try {
        const url = new URL(value);
        if (url.protocol !== "https:") {
          console.warn(`[env] ${value} is not https; the site should be served over https in production.`);
        }
      } catch {
        throw new Error(`CLIENT_URL / CLIENT_URLS contains an invalid address: ${value}`);
      }
    }

    const mailReady =
      (process.env.RESEND_API_KEY && process.env.MAIL_FROM_ADDRESS) ||
      (process.env.SMTP_USER && process.env.SMTP_PASSWORD);

    if (!mailReady) {
      console.warn(
        "[env] No email service configured (RESEND_API_KEY + MAIL_FROM_ADDRESS, or SMTP_USER + SMTP_PASSWORD). New accounts can't receive their confirmation link."
      );
    }
  } else if (process.env.NODE_ENV !== "development") {
    console.warn(
      `[env] NODE_ENV is "${process.env.NODE_ENV || "(not set)"}". Set it to "production" on the server host (secure cookies, proxy and error handling depend on it).`
    );
  }
};

module.exports = {
  validateEnv,
};