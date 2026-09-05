const multer =
  require("multer");

/*
|--------------------------------------------------------------------------
| Global error handler
|--------------------------------------------------------------------------
*/

const errorHandler = (
  err,
  req,
  res,
  next
) => {
  let statusCode =
    err.statusCode || 500;

  let message =
    err.message ||
    "Internal server error";

  let operational =
    Boolean(
      err.isOperational
    );

  /*
  |--------------------------------------------------------------------------
  | MongoDB duplicate key
  |--------------------------------------------------------------------------
  */

  if (err.code === 11000) {
    statusCode = 409;
    operational = true;

    const field =
      Object.keys(
        err.keyValue || {}
      )[0];

    message = field
      ? `${field} already exists`
      : "Resource already exists";
  }

  /*
  |--------------------------------------------------------------------------
  | Invalid MongoDB ObjectId
  |--------------------------------------------------------------------------
  */

  if (
    err.name === "CastError"
  ) {
    statusCode = 400;
    operational = true;

    message =
      "Invalid resource identifier";
  }

  /*
  |--------------------------------------------------------------------------
  | Mongoose validation
  |--------------------------------------------------------------------------
  */

  if (
    err.name ===
    "ValidationError"
  ) {
    statusCode = 400;
    operational = true;

    message =
      Object.values(
        err.errors
      )
        .map(
          (error) =>
            error.message
        )
        .join(", ");
  }

  /*
  |--------------------------------------------------------------------------
  | Invalid JSON
  |--------------------------------------------------------------------------
  */

  if (
    err instanceof
      SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    statusCode = 400;
    operational = true;

    message =
      "Invalid JSON request body";
  }

  /*
  |--------------------------------------------------------------------------
  | Multer upload errors
  |--------------------------------------------------------------------------
  */

  if (
    err instanceof
    multer.MulterError
  ) {
    statusCode = 400;
    operational = true;

    if (
      err.code ===
      "LIMIT_FILE_SIZE"
    ) {
      message =
        "Uploaded file exceeds the allowed size";
    } else if (
      err.code ===
      "LIMIT_FILE_COUNT"
    ) {
      message =
        "Too many files uploaded";
    } else {
      message =
        err.message ||
        "File upload failed";
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Never leak unexpected internal errors in production
  |--------------------------------------------------------------------------
  */

  if (
    process.env.NODE_ENV ===
      "production" &&
    statusCode >= 500 &&
    !operational
  ) {
    console.error(
      "Unexpected server error:",
      err
    );

    message =
      "Internal server error";
  }

  const response = {
    success: false,
    message,
  };

  /*
  |--------------------------------------------------------------------------
  | Stack only during development
  |--------------------------------------------------------------------------
  */

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    response.stack =
      err.stack;
  }

  res
    .status(statusCode)
    .json(response);
};

module.exports =
  errorHandler;