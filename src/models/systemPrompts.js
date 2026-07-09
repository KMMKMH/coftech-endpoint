const {
  repoSystemPrompts,
  repoSystemPromptsBackup,
} = require("../repositories/systemPrompts");
const PromptCache = require("../utils/PromptCache");
const logger = require("../utils/logger");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const promptCache = new PromptCache(50);

const getSystemPrompt = async (query) => {
  const { systemPromptID } = query;
  const cacheKey = systemPromptID;

  if (cacheKey) {
    const cachedResult = promptCache.get(cacheKey);
    if (cachedResult !== null) {
      logger.info(`Cache hit for UUID: ${cacheKey}`);
      return cachedResult;
    }
  }

  const result = await repoSystemPrompts.getByField({
    ...(systemPromptID && { "system_prompts.uuid_unique": systemPromptID }),
  });

  if (cacheKey && result.length > 0) {
    promptCache.set(cacheKey, result);
    logger.info(`Cached result for UUID: ${cacheKey}`);
  }

  return result;
};

const getSystemPromptBackup = async (query) => {
  const { originalID } = query;
  const cacheKey = originalID;

  if (cacheKey) {
    const cachedResult = promptCache.get(cacheKey);
    if (cachedResult !== null) {
      logger.info(`Cache hit for UUID: ${cacheKey}`);
      return cachedResult;
    }
  }

  const result = await repoSystemPromptsBackup.getByField({
    ...(originalID && {
      "system_prompts_backup.original_id": originalID,
    }),
  });

  if (cacheKey && result.length > 0) {
    promptCache.set(cacheKey, result);
    logger.info(`Cached result for UUID: ${cacheKey}`);
  }

  return result;
};

const createSystemPrompt = async (query, body) => {
  const { parentID } = query;
  const { prompt, key, name, created_by } = body;

  if (parentID) {
    const [parentPrompt] = await repoSystemPrompts.getByField({
      "system_prompts.uuid_unique": parentID,
    });

    if (!parentPrompt) {
      throw ApiError(
        404,
        `Parent system prompt '${parentID}' not found`,
        ErrorCodes.SYSTEM_PROMPT_PARENT_NOT_FOUND
      );
    }

    if (parentPrompt.parent_id) {
      throw ApiError(
        400,
        "Maximum nesting depth exceeded for system prompts",
        ErrorCodes.SYSTEM_PROMPT_MAX_DEPTH_EXCEEDED
      );
    }
  }

  const createdSystemPrompt = await repoSystemPrompts.save({
    prompt_data: prompt,
    key,
    name,
    created_by,
    parent_id: parentID || null,
  });

  if (parentID) {
    promptCache.delete(parentID);
    logger.info(
      `Cache invalidated for parent UUID: ${parentID} after child creation`
    );
  }

  return createdSystemPrompt;
};

const updateSystemPrompt = async (query, body) => {
  const { systemPromptID } = query;

  const [systemPromptField] = await repoSystemPrompts.getByField({
    "system_prompts.uuid_unique": systemPromptID,
  });

  const fieldsToUpdate = ["name", "prompt_data"];

  let dataUpdate = {};

  fieldsToUpdate.forEach((field) => {
    if (body[field] != undefined && body[field] != systemPromptField[field]) {
      dataUpdate[field] = body[field];
    }
  });

  if (Object.keys(dataUpdate).length > 0) {
    const result = await repoSystemPrompts.update(
      {
        "system_prompts.uuid_unique": systemPromptID,
      },
      dataUpdate
    );

    promptCache.delete(systemPromptID);
    logger.info(
      `Cache invalidated for UUID: ${systemPromptID} after update operation`
    );

    return result;
  } else {
    return true;
  }
};

const deleteSystemPrompt = async (query) => {
  const { systemPromptID } = query;

  const [childSystemPrompt] = await repoSystemPrompts.getByField({
    "system_prompts.parent_id": systemPromptID,
  });

  if (childSystemPrompt) {
    throw ApiError(
      400,
      "Cannot delete system prompt with existing children",
      ErrorCodes.SYSTEM_PROMPT_HAS_CHILDREN
    );
  }

  const result = await repoSystemPrompts.delete({
    "system_prompts.uuid_unique": systemPromptID,
  });

  promptCache.delete(systemPromptID);
  logger.info(
    `Cache invalidated for UUID: ${systemPromptID} after delete operation`
  );

  return result;
};

module.exports = {
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
  getSystemPrompt,
  getSystemPromptBackup,
};
