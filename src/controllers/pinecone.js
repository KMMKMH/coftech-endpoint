const Joi = require("joi");
const modelPinecone = require("../models/pinecone");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const repoFilemanager = require("../repositories/fileManager");
const { repoPineconeDisabledFiles } = require("../repositories/pinecone");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");
const { validateOrThrow } = require("../utils/middleware/joiValidator");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const disableDocument = async (req, res) => {
  const querySchema = Joi.object({
    companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
    fileID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const queryValues = validateOrThrow(querySchema, req.query);

  const { fileID, companyID } = queryValues;

  const [fileField] = await repoFilemanager.getFilesByField({
    "filemanager_files.company_id": companyID,
    "filemanager_files.uuid_unique": fileID,
  });
  if (!fileField)
    throw ApiError(404, "File not found", ErrorCodes.FILE_NOT_FOUND, {
      fileID,
    });

  const { name, extension } = fileField;

  const response = await modelPinecone.disableFile(queryValues);

  await repoDashLogs.save({
    user_id: req?.unique_token?.user,
    action_type: utilActionType.Disable,
    resource_type: utilResourceType.File,
    name: `${name}${extension}` || null,
    status: "success",
    company_id: companyID,
    metadata: { ...fileField },
  });

  res.status(200).json({ code: 200, status: true, data: response });
};

const getDisabledDocuments = async (req, res) => {
  const querySchema = Joi.object({
    companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const query = validateOrThrow(querySchema, req.query);

  const response = await modelPinecone.getDisabledFiles(query);
  res.status(200).json({ code: 200, status: true, data: response });
};

const deleteDisabledDocument = async (req, res) => {
  const querySchema = Joi.object({
    companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
    disabledFileID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const queryValues = validateOrThrow(querySchema, req.query);

  const { disabledFileID, companyID, botID } = queryValues;

  const [disabledFile] = await repoPineconeDisabledFiles.getByField({
    "pinecone_disabled_files.uuid_unique": disabledFileID,
    "pinecone_disabled_files.company_id": companyID,
    "pinecone_disabled_files.bot_id": botID,
  });

  if (!disabledFile)
    throw ApiError(
      404,
      "Disabled file not found",
      ErrorCodes.DISABLED_FILE_NOT_FOUND,
      {
        disabledFileID,
      }
    );

  const response = await modelPinecone.deleteDisabledFile(queryValues);

  const { file_id } = disabledFile;

  const [fileField] = await repoFilemanager.getFilesByField({
    "filemanager_files.company_id": companyID,
    "filemanager_files.uuid_unique": file_id,
  });
  if (!fileField)
    throw ApiError(404, "File not found", ErrorCodes.FILE_NOT_FOUND, {
      fileID: file_id,
    });

  const { name, extension } = fileField;

  await repoDashLogs.save({
    user_id: req?.unique_token?.user,
    action_type: utilActionType.Enabled,
    resource_type: utilResourceType.File,
    name: `${name}${extension}` || null,
    status: "success",
    company_id: companyID,
    metadata: { ...fileField },
  });

  res.status(200).json({ code: 200, status: true, data: response });
};

module.exports = {
  disableDocument,
  getDisabledDocuments,
  deleteDisabledDocument,
};
