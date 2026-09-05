const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "DB_NAME",
  "JWT_SECRET",
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
};

module.exports = {
  validateEnv,
};