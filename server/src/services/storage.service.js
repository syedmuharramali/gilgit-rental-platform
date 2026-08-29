const {
  storage,
  ID,
} = require("../config/appwrite");

const {
  InputFile,
} = require("node-appwrite/file");

/*
|--------------------------------------------------------------------------
| Upload private file
|--------------------------------------------------------------------------
*/

const uploadPrivateFile = async (
  file,
  filePrefix
) => {
 const mimeToExtension = {
  "image/jpeg": "jpg",
  "image/png": "png",
};

const extension = mimeToExtension[file.mimetype];

if (!extension) {
  throw new Error("Unsupported file type");
}

const filename =
  `${filePrefix}-${Date.now()}.${extension}`;

  const inputFile =
    InputFile.fromBuffer(
      file.buffer,
      filename
    );

  const uploadedFile =
    await storage.createFile({
      bucketId:
        process.env.APPWRITE_BUCKET_ID,

      fileId: ID.unique(),

      file: inputFile,

      // Explicitly private.
      permissions: [],
    });

  return {
    fileId: uploadedFile.$id,
    name: uploadedFile.name,
    mimeType: uploadedFile.mimeType,
    sizeOriginal:
      uploadedFile.sizeOriginal,
  };
};

/*
|--------------------------------------------------------------------------
| Delete file
|--------------------------------------------------------------------------
*/

const deleteFile = async (fileId) => {
  if (!fileId) {
    return;
  }

  await storage.deleteFile({
    bucketId:
      process.env.APPWRITE_BUCKET_ID,

    fileId,
  });
};

module.exports = {
  uploadPrivateFile,
  deleteFile,
};