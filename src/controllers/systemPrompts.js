const Joi = require("joi");
const modelSystemPrompts = require("../models/systemPrompts");
const { repoSystemPrompts } = require("../repositories/systemPrompts");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const getSystemPrompt = async (req, res) => {
  const paramsSchema = Joi.object({
    systemPromptID: Joi.string().uuid({ version: "uuidv4" }).allow(null, ""),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const response = await modelSystemPrompts.getSystemPrompt(valueQuery);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const getSystemPromptBackup = async (req, res) => {
  const paramsSchema = Joi.object({
    originalID: Joi.number().integer().allow(null, ""),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const response = await modelSystemPrompts.getSystemPromptBackup(valueQuery);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const createSystemPrompt = async (req, res) => {
  const paramsSchema = Joi.object({
    parentID: Joi.string().uuid({ version: "uuidv4" }).allow(null, ""),
  });

  const bodySchema = Joi.object({
    prompt: Joi.string().required(),
    key: Joi.string()
      .pattern(/^(SYSTEM|TEMPLATE)_[A-Za-z0-9_]{1,80}$/)
      .required()
      .messages({
        "string.pattern.base":
          "key must start with 'SYSTEM_' or 'TEMPLATE_' and contain only letters, numbers, and underscores (max 80 chars)",
      }),
    name: Joi.string().required(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);
  const valueBody = validateOrThrow(bodySchema, req.body);

  const { key } = valueBody;

  const [existingPromptField] = await repoSystemPrompts.getByField({
    "system_prompts.key": key,
  });

  if (existingPromptField) {
    throw ApiError(
      409,
      `System prompt key '${key}' already exists`,
      ErrorCodes.SYSTEM_PROMPT_KEY_ALREADY_EXISTS
    );
  }

  const { user } = req.unique_token;
  valueBody.created_by = user;

  const newPrompt = await modelSystemPrompts.createSystemPrompt(
    valueQuery,
    valueBody
  );

  return res.status(201).json({
    code: 201,
    status: true,
    data: newPrompt,
  });
};

const updateSystemPrompt = async (req, res) => {
  const paramsSchema = Joi.object({
    systemPromptID: Joi.string().uuid({ version: "uuidv4" }).required(),
  });

  const bodySchema = Joi.object({
    prompt_data: Joi.string().optional(),
    name: Joi.string().optional(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);
  const valueBody = validateOrThrow(bodySchema, req.body);

  const { systemPromptID } = valueQuery;

  const [existingPrompt] = await repoSystemPrompts.getByField({
    "system_prompts.uuid_unique": systemPromptID,
  });

  if (!existingPrompt) {
    throw ApiError(
      404,
      `System prompt '${systemPromptID}' not found`,
      ErrorCodes.SYSTEM_PROMPT_NOT_FOUND
    );
  }

  const updatedPrompt = await modelSystemPrompts.updateSystemPrompt(
    valueQuery,
    valueBody
  );

  return res.status(200).json({
    code: 200,
    status: true,
    data: updatedPrompt,
  });
};

const deleteSystemPrompt = async (req, res) => {
  const paramsSchema = Joi.object({
    systemPromptID: Joi.string().uuid({ version: "uuidv4" }).allow(null, ""),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const { systemPromptID } = valueQuery;

  const [existingPrompt] = await repoSystemPrompts.getByField({
    "system_prompts.uuid_unique": systemPromptID,
  });

  if (!existingPrompt) {
    throw ApiError(
      404,
      `System prompt '${systemPromptID}' not found`,
      ErrorCodes.SYSTEM_PROMPT_NOT_FOUND
    );
  }

  const response = await modelSystemPrompts.deleteSystemPrompt(valueQuery);

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

module.exports = {
  getSystemPrompt,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
  getSystemPromptBackup,
};
