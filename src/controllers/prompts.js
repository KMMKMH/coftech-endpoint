const Joi = require("joi");
const { repoPrompts } = require("../repositories/prompts");
const repoCompany = require("../repositories/company");
const repoBot = require("../repositories/bots");
const modelPrompt = require("../models/prompts");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const { generateChangesMetadata } = require("../utils/generateChangesMetadata");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const createPrompt = async (req, res) => {
  const params = Joi.object({
    companyID: Joi.string().guid({ version: "uuidv4" }).required(),
    botID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(params, req.query);

  const bodySchema = Joi.object({
    name: Joi.string().required(),
    data: Joi.string().trim().required(),
    type: Joi.number().integer().valid(0, 1).optional().allow(null).default(0),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  const { companyID, botID } = valueQuery;

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });

  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  const response = await modelPrompt.createPrompt(valueQuery, valueBody);

  const { name } = botField;

  await repoDashLogs.save({
    user_id: req?.unique_token?.user,
    action_type: utilActionType.Create,
    resource_type: utilResourceType.Prompt,
    name: name,
    status: "success",
    company_id: companyID,
    metadata: {
      changes: req.body,
      bot: {
        botID,
      },
    },
  });

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const listPrompts = async (req, res) => {
  const params = Joi.object({
    companyID: Joi.string().guid({ version: "uuidv4" }).required(),
    botID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(params, req.query);

  const response = await modelPrompt.listPrompts(valueQuery);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const getBackups = async (req, res) => {
  const params = Joi.object({
    companyID: Joi.string().guid({ version: "uuidv4" }).required(),
    botID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(params, req.query);

  const response = await modelPrompt.getBackups(valueQuery);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const updatePrompt = async (req, res) => {
  const params = Joi.object({
    companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
    promptID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(params, req.query);

  const bodySchema = Joi.object({
    name: Joi.string(),
    data: Joi.string().trim(),
    status: Joi.boolean(),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  const { companyID, botID, promptID } = valueQuery;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
      companyID,
    });
  }

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });
  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  const [promptField] = await repoPrompts.getByField({
    "prompts.uuid_unique": promptID,
    "prompts.company_id": companyID,
    "prompts.bot_id": botID,
  });
  if (!promptField) {
    throw ApiError(404, "Prompt not found", ErrorCodes.PROMPT_NOT_FOUND, {
      promptID,
    });
  }

  const response = await modelPrompt.updatePrompt(
    { companyID, botID, promptID },
    valueBody
  );

  const relevantKeys = ["name", "data", "status"];
  const oldValues = {};
  const newValues = {};

  for (const key of relevantKeys) {
    if (key in valueBody) {
      oldValues[key] = promptField[key];
      newValues[key] = valueBody[key];
    }
  }
  const metadata = {
    changes: generateChangesMetadata(oldValues, newValues),
    prompt: {
      promptID,
    },
    bot: {
      botID,
    },
  };

  const { name } = promptField;

  await repoDashLogs.save({
    user_id: req?.unique_token?.user,
    action_type: utilActionType.Update,
    resource_type: utilResourceType.Prompt,
    name: name,
    company_id: companyID,
    status: "success",
    metadata,
  });

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const deletePrompt = async (req, res) => {
  const params = Joi.object({
    companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
    promptID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(params, req.query);

  const { companyID, promptID } = valueQuery;

  const [promptField] = await repoPrompts.getByField({
    "prompts.uuid_unique": promptID,
  });
  if (!promptField) {
    throw ApiError(404, "Prompt not found", ErrorCodes.PROMPT_NOT_FOUND, {
      promptID,
    });
  }

  const response = await modelPrompt.deletePrompt(valueQuery);

  const { name } = promptField;

  await repoDashLogs.save({
    user_id: req?.unique_token?.user,
    action_type: utilActionType.Delete,
    resource_type: utilResourceType.Prompt,
    name: name,
    company_id: companyID,
    status: "success",
    metadata: {
      prompt: {
        promptID,
      },
    },
  });

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const assistancePrompt = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const promptAssistanceSchema = Joi.object({
    question: Joi.string().required(),
    answer: Joi.string().required(),
    history: Joi.array()
      .items(
        Joi.object({
          role: Joi.string().valid("assistant", "user").required().messages({
            "any.only": "Role must be 'assistant' or 'user'",
          }),
          content: Joi.string().required(),
        })
      )
      .optional(),
    prompt_in_progress: Joi.string().optional(),
  });

  const valueBody = validateOrThrow(promptAssistanceSchema, req.body);

  const { companyID, botID } = valueQuery;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
      companyID,
    });
  }

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });

  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  const result = await modelPrompt.assistancePrompt(valueQuery, valueBody);

  return res.status(200).json({
    code: 200,
    status: true,
    data: result,
  });
};

const testPrompt = async (req, res) => {
  const paramsSchema = Joi.object({
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const bodySchema = Joi.object({
    prompt: Joi.string().required(),
    data: Joi.string().trim().required(),
    history: Joi.array()
      .items(
        Joi.object({
          role: Joi.string().valid("assistant", "user").required().messages({
            "any.only": "Role must be assistant or user",
          }),
          content: Joi.string().required(),
        })
      )
      .optional(),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  if (!valueBody.history) {
    valueBody.history = [];
  }

  const response = await modelPrompt.testPrompt(valueQuery, valueBody);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

module.exports = {
  createPrompt,
  listPrompts,
  getBackups,
  updatePrompt,
  deletePrompt,
  assistancePrompt,
  testPrompt,
};
