// Command line interface entry point only
// Logging commands available but commented out or clearer overview in terminal

const path = require("path");
const fs = require("fs");
const { importMeiFile } = require("./importService");
const { logInfo, logWarn, logError } = require("../logging/logger");

// Directory containing MEI files
const MEI_DIR = path.resolve(__dirname, "../../mei_samples");
// const MEI_DIR = path.resolve(__dirname, "../../test_data/mei");

async function main() {
  const fileName = process.argv[2];

  // Single file import
  if (fileName) {
    const filePath = path.join(MEI_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // logInfo("Single-file import started", { fileName, filePath });

    const result = await importMeiFile(filePath);

    // logInfo("Single-file import complete", {
    //   fileName,
    //   workId: result.workId,
    //   personCount: result.personIds.length,
    //   movementCount: result.movementIds.length,
    //   sourceCount: result.sourceIds.length,
    // });

    return;
  }

  // Folder import
  logInfo("Folder import started", { directory: MEI_DIR });

  const files = fs
    .readdirSync(MEI_DIR)
    .filter((f) => f.endsWith(".xml") || f.endsWith(".mei"));

  if (files.length === 0) {
    logWarn("No MEI files found in directory", { directory: MEI_DIR });
    return;
  }

  // logInfo("MEI files discovered", {
  //   directory: MEI_DIR,
  //   fileCount: files.length,
  // });

  let successCount = 0;
  let failureCount = 0;

  for (const file of files) {
    const filePath = path.join(MEI_DIR, file);

    try {
      // logInfo("Importing file from folder", { fileName: file });

      const result = await importMeiFile(filePath);

      // logInfo("File import succeeded", {
      //   fileName: file,
      //   workId: result.workId,
      //   personCount: result.personIds.length,
      //   movementCount: result.movementIds.length,
      //   sourceCount: result.sourceIds.length,
      // });

      successCount++;
    } catch (err) {
      logError("File import failed", {
        fileName: file,
        error: err.message,
      });

      failureCount++;
    }
  }

  logInfo("Folder import complete", {
    directory: MEI_DIR,
    totalFiles: files.length,
    successCount,
    failureCount,
  });
}

main().catch((err) => {
  logError("Top-level import process failed", { error: err.message });
  process.exit(1);
});