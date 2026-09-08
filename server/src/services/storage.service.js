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

const diagnosticsEnabled = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.UPLOAD_DIAGNOSTICS === "true";

const elapsedMs = (startedAt) =>
  Number(process.hrtime.bigint() - startedAt) / 1e6;

const safeStatusCode = (error) =>
  Number(error?.code) ||
  Number(error?.response?.code) ||
  0;

/*
|--------------------------------------------------------------------------
| Create Appwrite file with retry
|--------------------------------------------------------------------------
|
| Appwrite Cloud can occasionally return temporary 503/5xx errors.
| We retry only temporary server errors, not validation/permission errors.
|
| Diagnostics record only stage timing, attempt number and file size. They
| intentionally do not log API keys, tokens, bucket IDs or private filenames.
|--------------------------------------------------------------------------
*/

const createFileWithRetry = async (
  options,
  maxAttempts = 3,
  diagnostics = {}
) => {
  let lastError;
  const overallStartedAt = process.hrtime.bigint();
  const fileBytes = Number(diagnostics.fileBytes) || 0;
  const kind = diagnostics.kind || "storage-file";

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const attemptStartedAt = process.hrtime.bigint();

    if (diagnosticsEnabled()) {
      console.log(
        `[UPLOAD_DIAG] appwrite start ${kind} | attempt=${attempt}/${maxAttempts} | bytes=${fileBytes}`
      );
    }

    try {
      const result = await storage.createFile(
        options
      );

      if (diagnosticsEnabled()) {
        console.log(
          `[UPLOAD_DIAG] appwrite success ${kind} | attempt=${attempt}/${maxAttempts} | attemptMs=${elapsedMs(attemptStartedAt).toFixed(1)} | totalMs=${elapsedMs(overallStartedAt).toFixed(1)} | bytes=${fileBytes}`
        );
      }

      return result;
    } catch (error) {
      lastError = error;

      const statusCode =
        safeStatusCode(error);

      const attemptDurationMs =
        elapsedMs(attemptStartedAt);

      const isTemporaryError =
        statusCode === 503 ||
        statusCode === 502 ||
        statusCode === 504 ||
        statusCode === 429 ||
        String(
          error.message
        ).includes("503");

      if (diagnosticsEnabled()) {
        console.warn(
          `[UPLOAD_DIAG] appwrite failure ${kind} | attempt=${attempt}/${maxAttempts} | status=${statusCode || "unknown"} | attemptMs=${attemptDurationMs.toFixed(1)} | totalMs=${elapsedMs(overallStartedAt).toFixed(1)} | temporary=${isTemporaryError}`
        );
      }

      if (
        !isTemporaryError ||
        attempt === maxAttempts
      ) {
        break;
      }

      const retryDelayMs =
        attempt * 1200;

      if (diagnosticsEnabled()) {
        console.warn(
          `[UPLOAD_DIAG] appwrite retry wait ${kind} | ${retryDelayMs} ms`
        );
      }

      await wait(
        retryDelayMs
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Clean temporary storage error
  |--------------------------------------------------------------------------
  */

  const statusCode =
    safeStatusCode(lastError);

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
    await createFileWithRetry(
      {
        bucketId:
          process.env
            .APPWRITE_BUCKET_ID,

        fileId:
          ID.unique(),

        file:
          inputFile,

        // Identity documents stay private.
        permissions: [],
      },
      3,
      {
        kind: "private-image",
        fileBytes: file.size,
      }
    );

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
    await createFileWithRetry(
      {
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
      },
      3,
      {
        kind: "property-image",
        fileBytes: file.size,
      }
    );

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
  fileId,
  maxAttempts = 3
) => {
  if (!fileId) {
    return;
  }

  let lastError;

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    try {
      await storage.deleteFile({
        bucketId:
          process.env
            .APPWRITE_BUCKET_ID,

        fileId,
      });

      return;
    } catch (error) {
      lastError = error;

      const statusCode =
        safeStatusCode(error);

      /*
      | If Appwrite already says the file
      | does not exist, deletion is effectively done.
      */
      if (statusCode === 404) {
        return;
      }

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
        `Appwrite delete temporarily failed. Retry ${attempt}/${maxAttempts}...`
      );

      await wait(
        attempt * 1000
      );
    }
  }

  throw lastError;
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