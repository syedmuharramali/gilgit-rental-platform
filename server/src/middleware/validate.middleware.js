const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const details = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));

    // Every page shows `message` and nothing reads `errors`, so put the first
    // real reason there instead of a bare "Validation failed".
    return res.status(400).json({
      success: false,
      message: details[0]?.message || "Validation failed",
      errors: details,
    });
  }

  next();
};

module.exports = validateRequest;