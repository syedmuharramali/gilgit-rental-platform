const multer = require("multer");

const AppError = require("../utils/AppError");

/*
|--------------------------------------------------------------------------
| Shared memory storage
|--------------------------------------------------------------------------
*/

const storage = multer.memoryStorage();

/*
|--------------------------------------------------------------------------
| Upload diagnostics
|--------------------------------------------------------------------------
|
| Enabled automatically outside production, or explicitly with:
| UPLOAD_DIAGNOSTICS=true
|
| These logs intentionally avoid tokens, storage keys, document contents,
| user IDs and original private filenames. They only record stage timing,
| file counts and aggregate byte sizes so we can locate upload latency.
|--------------------------------------------------------------------------
*/

const diagnosticsEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.UPLOAD_DIAGNOSTICS === "true";

const elapsedMs = (startedAt) =>
  Number(process.hrtime.bigint() - startedAt) / 1e6;

const flattenFiles = (files) => {
  if (Array.isArray(files)) {
    return files;
  }

  if (files && typeof files === "object") {
    return Object.values(files).flat();
  }

  return [];
};

const instrumentMultipart = (label, middleware) =>
  (req, res, next) => {
    const startedAt = process.hrtime.bigint();

    middleware(req, res, (error) => {
      const files = flattenFiles(req.files);
      const totalBytes = files.reduce(
        (sum, file) => sum + (Number(file.size) || 0),
        0
      );
      const durationMs = elapsedMs(startedAt);

      req.uploadDiagnostics = {
        ...(req.uploadDiagnostics || {}),
        multipartLabel: label,
        multipartMs: durationMs,
        fileCount: files.length,
        totalBytes,
      };

      if (diagnosticsEnabled()) {
        console.log(
          `[UPLOAD_DIAG] multipart ${label} | ${durationMs.toFixed(1)} ms | files=${files.length} | bytes=${totalBytes}`
        );
      }

      if (error) {
        return next(error);
      }

      return next();
    });
  };

/*
|--------------------------------------------------------------------------
| Identity verification filter
|--------------------------------------------------------------------------
*/

const identityImageFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new AppError(
        "CNIC and selfie files must be JPG or PNG images",
        400
      ),
      false
    );
  }

  cb(null, true);
};

/*
|--------------------------------------------------------------------------
| Property image filter
|--------------------------------------------------------------------------
*/

const propertyImageFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new AppError(
        "Property images must be JPG or PNG files",
        400
      ),
      false
    );
  }

  cb(null, true);
};

/*
|--------------------------------------------------------------------------
| Owner verification upload
|--------------------------------------------------------------------------
*/

const verificationUpload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },

  fileFilter: identityImageFilter,
});

exports.uploadVerificationDocuments =
  instrumentMultipart(
    "owner-verification",
    verificationUpload.fields([
      {
        name: "cnicFront",
        maxCount: 1,
      },
      {
        name: "cnicBack",
        maxCount: 1,
      },
      {
        name: "selfie",
        maxCount: 1,
      },
    ])
  );

/*
|--------------------------------------------------------------------------
| Property image upload
|--------------------------------------------------------------------------
*/

const propertyUpload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },

  fileFilter: propertyImageFilter,
});

exports.uploadPropertyImages =
  instrumentMultipart(
    "property-images",
    propertyUpload.array(
      "images",
      8
    )
  );

/*
|--------------------------------------------------------------------------
| Condition report evidence upload
|--------------------------------------------------------------------------
*/

const conditionEvidenceUpload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },

  fileFilter: propertyImageFilter,
});

exports.uploadConditionEvidence =
  instrumentMultipart(
    "condition-evidence",
    conditionEvidenceUpload.array(
      "images",
      6
    )
  );
