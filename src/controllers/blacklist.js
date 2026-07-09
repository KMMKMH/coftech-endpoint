const Joi = require("joi");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

const repoCompany = require("../repositories/company");
const repoBots = require("../repositories/bots");
const { repoBlacklist } = require("../repositories/blacklist");
const modelBlacklist = require("../models/blacklist");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const getBlacklistList = async (req, res) => {
  const querySchema = Joi.object({
    companyID: Joi.string().required(),
    botID: Joi.string().allow(null, ""),
    phone: Joi.string().allow(null, ""),
    type: Joi.string().allow(null, "").valid("CLIENT", "BOT"),
  });

  const queryValues = validateOrThrow(querySchema, req.query);
  const { companyID, botID, ...params } = queryValues;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(
      404,
      `Company: ${companyID} not found.`,
      ErrorCodes.COMPANY_NOT_FOUND,
      { companyID }
    );
  }

  let findParams = {
    "blacklist.company_id": companyID,
  };

  if (botID) {
    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw ApiError(
        404,
        `Bot: ${botID} not found.`,
        ErrorCodes.BOT_NOT_FOUND,
        { botID }
      );
    }

    findParams["blacklist.bot_id"] = botID;
  }

  if (params.phone) {
    const phoneNumber = parsePhoneNumberFromString(
      params.phone.startsWith("+") ? params.phone : `+${params.phone}`
    );

    if (!phoneNumber || !phoneNumber.isValid()) {
      throw ApiError(
        400,
        "Invalid phone number",
        ErrorCodes.VALIDATION_ERROR,
        { phone: params.phone }
      );
    }

    params.phone = phoneNumber.format("E.164").replace("+", "");
  }

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      findParams[`blacklist.${key}`] = value;
    }
  }

  const response = await repoBlacklist.getByField(findParams);

  res.status(200).json({
    code: 200,
    status: true,
    data: response.length > 0 ? response : [],
  });
};

const createBlacklist = async (req, res) => {
  const paramsSchema = Joi.object({
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  validateOrThrow(paramsSchema, req.query);

  const bodySchema = Joi.object({
    phone: Joi.string()
      .pattern(/^\+?[0-9\s-]{10,15}$/)
      .required(),
  });

  validateOrThrow(bodySchema, req.body);

  const { phone } = req.body;
  const phoneNumber = parsePhoneNumberFromString(
    phone.startsWith("+") ? phone : `+${phone}`
  );

  if (!phoneNumber || !phoneNumber.isValid()) {
    throw ApiError(
      400,
      "Invalid phone number",
      ErrorCodes.VALIDATION_ERROR,
      { phone }
    );
  }

  const formattedPhone = phoneNumber.format("E.164").replace("+", "");

  const response = await modelBlacklist.saveBlacklist(req.query, {
    phone: formattedPhone,
  });

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const deleteBlacklist = async (req, res) => {
  const paramsSchema = Joi.object({
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  validateOrThrow(paramsSchema, req.query);

  const bodySchema = Joi.object({
    phone: Joi.string()
      .pattern(/^\+?[0-9\s-]{10,15}$/)
      .required(),
  });

  validateOrThrow(bodySchema, req.body);

  const { phone } = req.body;
  const phoneNumber = parsePhoneNumberFromString(
    phone.startsWith("+") ? phone : `+${phone}`
  );

  if (!phoneNumber || !phoneNumber.isValid()) {
    throw ApiError(
      400,
      "Invalid phone number",
      ErrorCodes.VALIDATION_ERROR,
      { phone }
    );
  }

  const formattedPhone = phoneNumber.format("E.164").replace("+", "");

  const response = await modelBlacklist.deleteBlacklist(req.query, {
    phone: formattedPhone,
  });

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

module.exports = {
  createBlacklist,
  getBlacklistList,
  deleteBlacklist,
};