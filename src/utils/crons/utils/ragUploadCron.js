const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const modelFilemanager = require("../../../models/fileManager");
const repoFilemanager = require("../../../repositories/fileManager");

const TIMEOUT = parseInt(process.env.RAG_UPLOAD_TIMEOUT || "30");

const ragUploadCron = async () => {
  try {
    const now = dayjs();
    await repoFilemanager.deleteRagFileUploadStatus({
      "filemanager_rag_status.is_completed": true
    });

    const pendingFiles = await repoFilemanager.getRagFileUploadStatusByField({
      "filemanager_rag_status.is_completed": false,
    });
    if(!pendingFiles || pendingFiles.length === 0) {
      return;
    };

    for (const file of pendingFiles) {
      if (now.diff(file.date, "minutes") <= TIMEOUT) {
        continue;
      }

      await modelFilemanager.clearUncompletedFile(file.file_id);
      await repoFilemanager.deleteRagFileUploadStatus({
        "filemanager_rag_status.uuid_unique": file.uuid_unique,
      });

      console.log(`File ${file.file_id} cleared due to timeout.`);
    }
  } catch (error) {
    console.error("Error in ragUploadCron:", error);
  }
};

module.exports = ragUploadCron;