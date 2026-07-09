const Joi = require("joi");

const repoCompany = require("../repositories/company");
const { repoStorage, repoStorageLogs } = require("../repositories/storage");
const modelStorage = require("../models/storage");

const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const getStorageList = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().required(),
    storageID: Joi.string().allow("", null),
  });

  const { companyID, storageID } = validateOrThrow(paramsSchema, req.query);

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(
      404,
      `Company: ${companyID} not found.`,
      ErrorCodes.COMPANY_NOT_FOUND
    );
  }

  if (storageID) {
    const [storageField] = await repoStorage.getByField({
      "storage_company.uuid_unique": storageID,
    });

    if (!storageField) {
      throw ApiError(
        404,
        `Storage: ${storageID} not found.`,
        ErrorCodes.STORAGE_NOT_FOUND
      );
    }
  }

  const findParams = {
    "storage_company.company_id": companyID,
    ...(storageID && { "storage_company.uuid_unique": storageID }),
  };

  const response = await repoStorage.getByField(findParams);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response.length > 0 ? response : [],
  });
};

const createStorage = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().required(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const bodySchema = Joi.object({
    quota: Joi.number()
      .required()
      .custom((value, helpers) => {
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
          return helpers.error("any.invalid");
        }
        return parsedValue;
      }, "Custom number validation")
      .messages({
        "any.invalid": "Quota must be a valid integer",
      }),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  const response = await modelStorage.saveStorage(valueQuery, valueBody);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const updateStorage = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().required(),
    storageID: Joi.string().required(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const bodySchema = Joi.object({
    quota: Joi.number()
      .allow("", null)
      .custom((value, helpers) => {
        const parsedValue = parseInt(value, 10);
        if (isNaN(parsedValue)) {
          return helpers.error("any.invalid");
        }
        return parsedValue;
      }, "Custom number validation")
      .messages({
        "any.invalid": "Quota must be a valid integer",
      }),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  const response = await modelStorage.updateStorage(valueQuery, valueBody);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const deleteStorage = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().required(),
    storageID: Joi.string().required(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const response = await modelStorage.deleteStorage(valueQuery);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const getStorageLogsList = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().required(),
    storageLogID: Joi.string().allow("", null),
  });

  const { companyID, storageLogID } = validateOrThrow(paramsSchema, req.query);

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(
      404,
      `Company: ${companyID} not found.`,
      ErrorCodes.COMPANY_NOT_FOUND
    );
  }

  if (storageLogID) {
    const [storageLogsField] = await repoStorageLogs.getByField({
      "storage_logs.uuid_unique": storageLogID,
    });

    if (!storageLogsField) {
      throw ApiError(
        404,
        `StorageLogs: ${storageLogID} not found.`,
        ErrorCodes.STORAGE_LOG_NOT_FOUND
      );
    }
  }

  const findParams = {
    "storage_logs.company_id": companyID,
    ...(storageLogID && { "storage_logs.uuid_unique": storageLogID }),
  };

  const response = await repoStorageLogs.getByField(findParams);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response.length > 0 ? response : [],
  });
};

module.exports = {
  createStorage,
  updateStorage,
  getStorageList,
  deleteStorage,
  getStorageLogsList,
};