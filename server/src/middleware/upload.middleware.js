const multer = require("multer");

const AppError = require("../utils/AppError");

const storage = multer.memoryStorage();

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(
      new AppError(
        "Only JPG and PNG images are allowed for identity verification",
        400
      ),
      false
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 3,
  },

  fileFilter,
});

exports.uploadVerificationDocuments = upload.fields([
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