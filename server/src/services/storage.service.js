const {
  Permission,
  Role,
} = require("node-appwrite");

const {
  storage,
  ID,
} = require("../config/appwrite");

const {
  InputFile,
} = require("node-appwrite/file");

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

const wait = (milliseconds) =>
  new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );

/*
|--------------------------------------------------------------------------
| Create Appwrite file with retry
|--------------------------------------------------------------------------
|
| Appwrite Cloud can occasionally return temporary 503/5xx errors.
| We retry only temporary server errors, not validation/permission errors.
|
*/

const createFileWithRetry = async (
  options,
  maxAttempts = 3
) => {
  let lastError;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      return await storage.createFile(
        options
      );
    } catch (error) {
      lastError = error;

      const statusCode =
        Number(error.code) ||
        Number(
          error.response?.code
        ) ||
        0;

      const isTemporaryError =
        statusCode === 503 ||
        statusCode === 502 ||
        statusCode === 504 ||
        statusCode === 429 ||
        String(
          error.message
        ).includes("503");

      if (
        !isTemporaryError ||
        attempt === maxAttempts
      ) {
        break;
      }

      console.warn(
        `Appwrite upload temporarily failed. Retry ${attempt}/${maxAttempts}...`
      );

      await wait(
        attempt * 1200
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Clean temporary storage error
  |--------------------------------------------------------------------------
  */

  const statusCode =
    Number(lastError?.code) ||
    Number(
      lastError?.response?.code
    ) ||
    0;

  if (
    statusCode === 503 ||
    statusCode === 502 ||
    statusCode === 504 ||
    String(
      lastError?.message
    ).includes("503")
  ) {
    const error = new Error(
      "Storage service is temporarily unavailable. Please try again shortly."
    );

    error.statusCode = 503;
    error.isOperational = true;

    throw error;
  }

  throw lastError;
};

/*
|--------------------------------------------------------------------------
| Upload private file
|--------------------------------------------------------------------------
|
| Used for CNIC front, CNIC back and selfie.
| No public permissions.
|
*/

const uploadPrivateFile = async (
  file,
  filePrefix
) => {
  const extension =
    mimeToExtension[
      file.mimetype
    ];

  if (!extension) {
    throw new Error(
      "Unsupported file type"
    );
  }

  const filename =
    `${filePrefix}-${Date.now()}.${extension}`;

  const inputFile =
    InputFile.fromBuffer(
      file.buffer,
      filename
    );

  const uploadedFile =
    await createFileWithRetry({
      bucketId:
        process.env
          .APPWRITE_BUCKET_ID,

      fileId:
        ID.unique(),

      file:
        inputFile,

      // Identity documents stay private.
      permissions: [],
    });

  return {
    fileId:
      uploadedFile.$id,

    name:
      uploadedFile.name,

    mimeType:
      uploadedFile.mimeType,

    sizeOriginal:
      uploadedFile.sizeOriginal,
  };
};

/*
|--------------------------------------------------------------------------
| Upload public property image
|--------------------------------------------------------------------------
|
| Property photos are publicly viewable.
| Identity documents remain private because permissions are per file.
|
*/

const uploadPublicImage = async (
  file,
  filePrefix
) => {
  const extension =
    mimeToExtension[
      file.mimetype
    ];

  if (!extension) {
    throw new Error(
      "Unsupported property image type"
    );
  }

  const filename =
    `${filePrefix}-${Date.now()}-${ID.unique()}.${extension}`;

  const inputFile =
    InputFile.fromBuffer(
      file.buffer,
      filename
    );

  const uploadedFile =
    await createFileWithRetry({
      bucketId:
        process.env
          .APPWRITE_BUCKET_ID,

      fileId:
        ID.unique(),

      file:
        inputFile,

      permissions: [
        Permission.read(
          Role.any()
        ),
      ],
    });

  return {
    fileId:
      uploadedFile.$id,

    name:
      uploadedFile.name,

    mimeType:
      uploadedFile.mimeType,

    sizeOriginal:
      uploadedFile.sizeOriginal,
  };
};

/*
|--------------------------------------------------------------------------
| Delete file
|--------------------------------------------------------------------------
*/

const deleteFile = async (
  fileId
) => {
  if (!fileId) {
    return;
  }

  await storage.deleteFile({
    bucketId:
      process.env
        .APPWRITE_BUCKET_ID,

    fileId,
  });
};

/*
|--------------------------------------------------------------------------
| Get private file
|--------------------------------------------------------------------------
|
| Used by protected admin verification routes.
|
*/

const getPrivateFileView =
  async (fileId) => {
    const result =
      await storage.getFileView({
        bucketId:
          process.env
            .APPWRITE_BUCKET_ID,

        fileId,
      });

    return result;
  };

/*
|--------------------------------------------------------------------------
| Generate public property image URL
|--------------------------------------------------------------------------
*/

const getPublicFileViewUrl = (
  fileId
) => {
  const endpoint =
    process.env
      .APPWRITE_ENDPOINT
      .replace(/\/$/, "");

  return (
    `${endpoint}/storage/buckets/` +
    `${process.env.APPWRITE_BUCKET_ID}` +
    `/files/${fileId}/view` +
    `?project=${process.env.APPWRITE_PROJECT_ID}`
  );
};

/*
|--------------------------------------------------------------------------
| Exports
|--------------------------------------------------------------------------
*/

module.exports = {
  uploadPrivateFile,
  uploadPublicImage,
  deleteFile,
  getPrivateFileView,
  getPublicFileViewUrl,
};