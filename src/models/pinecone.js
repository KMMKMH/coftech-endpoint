const {
  repoPineconeIndexFiles,
  repoPineconeChunkLogs,
  repoPineconeDisabledFiles,
} = require("../repositories/pinecone");
const repoBots = require("../repositories/bots");
const repoFilemanager = require("../repositories/fileManager");
const repoCompany = require("../repositories/company");
const repoAccount = require("../repositories/accounts");
const logger = require("../utils/logger");
const modelBots = require("./bots");
const createBotQueue = require("../utils/rabbit/createBotQueue");
const { sendDataToInstance } = require("../utils/sendDataToInstance");
const { getPineconeClient } = require("../utils/pineconeClient");
const {
  emitUploadProgress,
  emitUploadComplete,
} = require("../utils/socket/progressBar");
const { BOT_EVENTS } = require("../utils/events");
const {
  createOrGetIndex,
  saveVectors,
  deleteDocumentChunks,
  updateMetadata,
} = require("../utils/pineconeOperations");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const validateQueryParams = async ({ companyID, botID }) => {
  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField)
    throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
      companyID,
    });

  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });
  if (!botField)
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });

  return { companyField, botField };
};

const saveEmbeddingToPinecone = async (query, body) => {
  const { companyID, botID, fileID, extraMetadata } = query;
  const { payload } = body;

  await validateQueryParams({ companyID, botID });

  const [fileField] = await repoFilemanager.getFilesByField({
    "filemanager_files.identificator": fileID,
    "filemanager_files.company_id": companyID,
    "filemanager_files.source": "rag",
  });
  if (!fileField)
    throw ApiError(404, "File not found", ErrorCodes.FILE_NOT_FOUND, {
      fileID,
    });

  let [indexFile] = await repoPineconeIndexFiles.getByField({
    "pinecone_index_files.file_id": fileID,
    "pinecone_index_files.index_id": botID,
  });

  const pinecone = await getPineconeClient(botID);
  const index = await createOrGetIndex(pinecone, botID);
  const response = await saveVectors(index, payload);

  if (response) {
    if (!indexFile) {
      await repoPineconeIndexFiles.save({
        "pinecone_index_files.index_id": botID,
        "pinecone_index_files.file_id": fileID,
      });
      [indexFile] = await repoPineconeIndexFiles.getByField({
        "pinecone_index_files.file_id": fileID,
        "pinecone_index_files.index_id": botID,
      });
    }

    const { uuid_unique } = indexFile;
    const { chunknumber, totalChunks } = payload[0].metadata;
    const chunk_number = parseInt(chunknumber, 10);

    await repoPineconeChunkLogs.save({
      file_id: fileID,
      index_file_id: uuid_unique,
      chunk_number,
      ...(extraMetadata && { metadata: JSON.stringify(extraMetadata) }),
    });

    const chunksSaved = await repoPineconeChunkLogs.countChunksByFileID({
      "pinecone_chunk_logs.file_id": fileID,
      "pinecone_chunk_logs.index_file_id": uuid_unique,
    });

    const { name, extension, upload_by } = fileField;
    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": upload_by,
    });
    if (!accountField)
      throw ApiError(404, "Account not found", ErrorCodes.ACCOUNT_NOT_FOUND, {
        upload_by,
      });

    const progress = Math.round((chunksSaved / totalChunks) * 100);
    emitUploadProgress(upload_by, fileID, progress);

    const allChunksUploaded = await repoPineconeChunkLogs.isFileUploadComplete(
      fileID,
      totalChunks
    );

    if (allChunksUploaded) {
      const bodyMessage = {
        message: `File ${name}.${extension} uploaded successfully by ${accountField.first_name} ${accountField.last_name}`,
      };

      await modelBots.sendMessageToAdmins({ companyID, botID }, bodyMessage);
      await repoFilemanager.updateRagFileUploadStatus({
        file_id: fileID,
        is_completed: true,
      });
      emitUploadComplete(upload_by, fileID, bodyMessage.message);
    }
  }

  return response;
};

const deleteDocument = async (query) => {
  const { companyID, botID, fileID } = query;
  await validateQueryParams({ companyID, botID });

  const [fileField] = await repoFilemanager.getFilesByField({
    "filemanager_files.identificator": fileID,
    "filemanager_files.company_id": companyID,
    "filemanager_files.source": "rag",
  });
  if (!fileField)
    throw ApiError(404, "File not found", ErrorCodes.FILE_NOT_FOUND, {
      fileID,
    });

  const [documentField] = await repoPineconeIndexFiles.getByField({
    "pinecone_index_files.file_id": fileID,
    "pinecone_index_files.index_id": botID,
  });
  if (!documentField)
    throw ApiError(404, "Document not found", ErrorCodes.DOCUMENT_NOT_FOUND, {
      fileID,
    });

  const pinecone = await getPineconeClient(botID);
  const index = await createOrGetIndex(pinecone, botID);
  const response = await deleteDocumentChunks(index, fileID);

  if (response) {
    await repoPineconeIndexFiles.delete({
      "pinecone_index_files.file_id": fileID,
      "pinecone_index_files.index_id": botID,
    });
  }

  return response;
};

const disableFile = async (query) => {
  const { companyID, botID, fileID } = query;
  await validateQueryParams({ companyID, botID });

  const [existFile] = await repoFilemanager.getFilesByField({
    "filemanager_files.company_id": companyID,
    "filemanager_files.uuid_unique": fileID,
    "filemanager_files.source": "rag",
  });
  if (!existFile)
    throw ApiError(404, "File not found", ErrorCodes.FILE_NOT_FOUND, {
      fileID,
    });

  const [alreadyDisabled] = await repoPineconeDisabledFiles.getByField({
    "pinecone_disabled_files.company_id": companyID,
    "pinecone_disabled_files.bot_id": botID,
    "pinecone_disabled_files.file_id": fileID,
  });
  if (alreadyDisabled)
    throw ApiError(
      400,
      "File already disabled",
      ErrorCodes.FILE_ALREADY_DISABLED,
      { fileID }
    );

  const response = await repoPineconeDisabledFiles.save({
    company_id: companyID,
    bot_id: botID,
    file_id: fileID,
  });

  await updateRagDisabledFiles({ companyID, botID });
  return response;
};

const getDisabledFiles = async (query) => {
  const { companyID, botID } = query;
  await validateQueryParams({ companyID, botID });

  return await repoPineconeDisabledFiles.getByField({
    "pinecone_disabled_files.company_id": companyID,
    "pinecone_disabled_files.bot_id": botID,
  });
};

const deleteDisabledFile = async (query) => {
  const { companyID, botID, disabledFileID } = query;
  await validateQueryParams({ companyID, botID });

  const [disabledFile] = await repoPineconeDisabledFiles.getByField({
    "pinecone_disabled_files.uuid_unique": disabledFileID,
    "pinecone_disabled_files.company_id": companyID,
    "pinecone_disabled_files.bot_id": botID,
  });
  if (!disabledFile)
    throw ApiError(404, "Disabled file not found", ErrorCodes.FILE_NOT_FOUND, {
      disabledFileID,
    });

  const response = await repoPineconeDisabledFiles.delete({
    "pinecone_disabled_files.uuid_unique": disabledFileID
  });
  await updateRagDisabledFiles({ companyID, botID });

  return response;
};

const getBotRagConfigs = async ({ bot_id: botID }) => {
  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
  });
  if (!botField)
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });

  const companyID = botField.company_id;
  await validateQueryParams({ companyID, botID });

  const [pineconeStatusField] = await repoCompany.getCompanyConfigByField({
    "company_configs.bot_id": botID,
    "company_configs.company_id": companyID,
    "configs_templates.key": "PINECONE_STATUS",
  });

  if (!pineconeStatusField || pineconeStatusField.data !== "true") return;

  return await updateRagDisabledFiles({ companyID, botID, send: false });
};

const updateRagDisabledFiles = async ({ companyID, botID, send = true }) => {
  const disabledFiles = await repoPineconeDisabledFiles.getByField({
    "pinecone_disabled_files.company_id": companyID,
    "pinecone_disabled_files.bot_id": botID,
  });

  const filesField = await repoFilemanager.getFilesByField({
    "filemanager_files.company_id": companyID,
    "filemanager_files.source": "rag",
    "pinecone_index_files.index_id": botID,
  });

  const disabledFileIdentifiers = disabledFiles.map(
    (file) => file.identificator
  );

  const enabledFiles = filesField
    .filter((file) => !disabledFileIdentifiers.includes(file.identificator))
    .map((file) => ({
      identifier: file.identificator,
      filename: file.name,
      file_extension: file.extension,
      description: file?.description,
    }));

  const data = [
    { key: "ENABLED_FILES", data: JSON.stringify(enabledFiles) },
    { key: "DISABLED_FILES", data: JSON.stringify(disabledFileIdentifiers) },
  ];

  if (send) {
    const queue = createBotQueue(botID);
    await sendDataToInstance(queue, BOT_EVENTS.SET_RAG_CONFIGS, data);
  }

  return data;
};

const updateVectorMetadata = async (query, body) => {
  const { companyID, botID, fileID } = query;
  const { description } = body;

  await validateQueryParams({ companyID, botID });

  const [fileField] = await repoFilemanager.getFilesByField({
    "filemanager_files.identificator": fileID,
    "filemanager_files.company_id": companyID,
  });
  if (!fileField)
    throw ApiError(404, "File not found", ErrorCodes.FILE_NOT_FOUND, {
      fileID,
    });

  const [pineconeIndexField] = await repoPineconeIndexFiles.getByField({
    "pinecone_index_files.file_id": fileID,
    "pinecone_index_files.index_id": botID,
  });
  if (!pineconeIndexField)
    throw ApiError(404, "Index not found", ErrorCodes.INDEX_NOT_FOUND, {
      fileID,
    });

  const chunksField = await repoPineconeChunkLogs.getByField({
    "pinecone_chunk_logs.file_id": fileID,
  });

  const pinecone = await getPineconeClient(botID);
  const index = await createOrGetIndex(pinecone, botID);

  const BATCH_SIZE = 100;
  for (let i = 0; i < chunksField.length; i += BATCH_SIZE) {
    const batch = chunksField.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (chunk) => {
        const vectorID = `${fileID}:chunk:${chunk.chunk_number}`;
        const fetched = await index.fetch([vectorID]);
        const currentMetadata = fetched?.vectors?.[vectorID]?.metadata || {};

        if (!description) delete currentMetadata.description;
        else currentMetadata.description = description;

        await updateMetadata(index, {
          id: vectorID,
          metadata: currentMetadata,
        });
      })
    );

    logger.info(`Batch ${i / BATCH_SIZE + 1} completed`);
  }

  return { success: true, message: "Metadata updated successfully" };
};

module.exports = {
  saveEmbeddingToPinecone,
  deleteDocument,
  disableFile,
  getDisabledFiles,
  deleteDisabledFile,
  getBotRagConfigs,
  updateRagDisabledFiles,
  updateVectorMetadata,
};
