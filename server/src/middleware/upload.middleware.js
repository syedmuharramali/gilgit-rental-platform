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
  ]);

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
  propertyUpload.array(
    "images",
    8
  );