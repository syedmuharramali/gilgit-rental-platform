require("dotenv").config();

const fs = require("fs");
const path = require("path");
const {
  Permission,
  Role,
} = require("node-appwrite");
const {
  InputFile,
} = require("node-appwrite/file");
const {
  storage,
  ID,
} = require("../config/appwrite");

const MB = 1024 * 1024;

const elapsedMs = (startedAt) =>
  Number(process.hrtime.bigint() - startedAt) / 1e6;

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / MB).toFixed(2)} MB`;
};

const syntheticJpeg = () => {
  // Tiny valid JPEG followed by harmless padding so the default diagnostic
  // file is close to the size that showed the production latency problem.
  const base = Buffer.from(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAEf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=",
    "base64"
  );

  const targetSize = 120 * 1024;
  if (base.length >= targetSize) return base;
  return Buffer.concat([base, Buffer.alloc(targetSize - base.length)]);
};

const loadDiagnosticFile = () => {
  const suppliedPath = process.argv[2];

  if (!suppliedPath) {
    return {
      buffer: syntheticJpeg(),
      name: "storage-diagnostic-120kb.jpg",
      source: "synthetic 120 KB JPEG",
    };
  }

  const resolved = path.resolve(suppliedPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Diagnostic file not found: ${resolved}`);
  }

  return {
    buffer: fs.readFileSync(resolved),
    name: path.basename(resolved),
    source: resolved,
  };
};

const run = async () => {
  const required = [
    "APPWRITE_ENDPOINT",
    "APPWRITE_PROJECT_ID",
    "APPWRITE_API_KEY",
    "APPWRITE_BUCKET_ID",
  ];

  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing Appwrite environment values: ${missing.join(", ")}`);
  }

  const file = loadDiagnosticFile();

  console.log("\n========================================");
  console.log(" Appwrite Storage Diagnostic");
  console.log("========================================");
  console.log(` Source     : ${file.source}`);
  console.log(` File size  : ${formatBytes(file.buffer.length)} (${file.buffer.length} bytes)`);
  console.log(" Trials     : 3 sequential SDK uploads");
  console.log(" Cleanup    : each diagnostic file is deleted");
  console.log("========================================\n");

  const listStartedAt = process.hrtime.bigint();
  await storage.listFiles({
    bucketId: process.env.APPWRITE_BUCKET_ID,
    queries: [],
  });
  console.log(`[STORAGE_DIAG] listFiles | ${elapsedMs(listStartedAt).toFixed(1)} ms`);

  const uploadDurations = [];

  for (let trial = 1; trial <= 3; trial += 1) {
    const fileId = ID.unique();
    const diagnosticName = `diag-${Date.now()}-${trial}.jpg`;
    const inputFile = InputFile.fromBuffer(file.buffer, diagnosticName);

    const uploadStartedAt = process.hrtime.bigint();
    let uploaded = false;

    try {
      await storage.createFile({
        bucketId: process.env.APPWRITE_BUCKET_ID,
        fileId,
        file: inputFile,
        permissions: [Permission.read(Role.any())],
      });

      const uploadMs = elapsedMs(uploadStartedAt);
      uploadDurations.push(uploadMs);
      uploaded = true;

      console.log(
        `[STORAGE_DIAG] upload ${trial}/3 | success | ${uploadMs.toFixed(1)} ms | bytes=${file.buffer.length}`
      );
    } catch (error) {
      const uploadMs = elapsedMs(uploadStartedAt);
      const status = Number(error?.code) || Number(error?.response?.code) || "unknown";
      console.log(
        `[STORAGE_DIAG] upload ${trial}/3 | FAILED | ${uploadMs.toFixed(1)} ms | status=${status}`
      );
      throw error;
    } finally {
      if (uploaded) {
        const deleteStartedAt = process.hrtime.bigint();
        try {
          await storage.deleteFile({
            bucketId: process.env.APPWRITE_BUCKET_ID,
            fileId,
          });
          console.log(
            `[STORAGE_DIAG] delete ${trial}/3 | ${elapsedMs(deleteStartedAt).toFixed(1)} ms`
          );
        } catch (error) {
          console.warn(
            `[STORAGE_DIAG] cleanup warning ${trial}/3 | ${error.message}`
          );
        }
      }
    }
  }

  if (uploadDurations.length) {
    const average = uploadDurations.reduce((sum, value) => sum + value, 0) / uploadDurations.length;
    console.log(`\n[STORAGE_DIAG] average SDK upload | ${average.toFixed(1)} ms`);
  }
};

run().catch((error) => {
  console.error("\nStorage diagnostic failed:", error.message);
  process.exitCode = 1;
});
