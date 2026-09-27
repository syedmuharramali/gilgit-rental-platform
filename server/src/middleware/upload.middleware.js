const multer = require("multer");

const AppError = require("../utils/AppError");

/*
|--------------------------------------------------------------------------
| Shared memory storage
|--------------------------------------------------------------------------
*/

const storage = multer.memoryStorage();
const ONE_MB = 1024 * 1024;

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

/*
| The browser says what type a file is, but anyone can lie about that.
| Check the first bytes: JPEG starts FF D8 FF, PNG with its 8-byte header.
*/
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const isRealImage = (file) => {
  const bytes = file?.buffer;

  if (!Buffer.isBuffer(bytes) || bytes.length < 8) {
    return false;
  }

  if (file.mimetype === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (file.mimetype === "image/png") {
    return bytes.subarray(0, 8).equals(PNG_SIGNATURE);
  }

  return false;
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
        if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
          error.message = label === "owner-verification"
            ? "Verification images must be 1 MB or smaller"
            : "Property images must be 1 MB or smaller";
        }

        return next(error);
      }

      if (files.some((file) => !isRealImage(file))) {
        return next(
          new AppError(
            "That file isn't a real JPG or PNG image. Please choose another photo.",
            400
          )
        );
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
    fileSize: ONE_MB,
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
    fileSize: ONE_MB,
    files: 1,
  },

  fileFilter: propertyImageFilter,
});

exports.uploadPropertyImages =
  instrumentMultipart(
    "property-images",
    propertyUpload.array(
      "images",
      1
    )
  );
