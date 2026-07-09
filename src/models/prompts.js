const { OpenAI } = require("openai");
const dayjs = require("dayjs");
const { withTransaction } = require("../repositories/base");
const { repoPrompts, repoPromptsBackup } = require("../repositories/prompts");
const repoCompany = require("../repositories/company");
const repoBot = require("../repositories/bots");
const repoAWS = require("../repositories/aws");
const { sendDataToInstance } = require("../utils/sendDataToInstance");
const { getAssistanceSystemPrompt } = require("../utils/promptUtils");
const { BOT_EVENTS } = require("../utils/events");
const createBotQueue = require("../utils/rabbit/createBotQueue");
const imageProcessingHelper = require("../utils/imageProcessingHelper");
const logger = require("../utils/logger");
const ErrorCodes = require('../constants/errorCodes');
const { ApiError } = require('../utils/errors/ApiError');

const listPrompts = async (query) => {
  const { companyID, botID } = query;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(404, 'Company not found', ErrorCodes.COMPANY_NOT_FOUND, { companyID });
  }

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });
  if (!botField) {
    throw ApiError(404, 'Bot not found', ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  return await repoPrompts.getByField({
    "prompts.company_id": companyID,
    "prompts.bot_id": botID,
  });
};

const getBackups = async (query) => {
  const { companyID, botID } = query;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(404, 'Company not found', ErrorCodes.COMPANY_NOT_FOUND, { companyID });
  }

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });
  if (!botField) {
    throw ApiError(404, 'Bot not found', ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  const promptsBackupsFields = await repoPromptsBackup.getByField({
    "prompts_backup.company_id": companyID,
    "prompts_backup.bot_id": botID,
  });

  return promptsBackupsFields;
};

const createPrompt = async (query, body) => {
  const { botID, companyID } = query;
  const { data } = body;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(404, 'Company not found', ErrorCodes.COMPANY_NOT_FOUND, { companyID });
  }

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
  });
  if (!botField) {
    throw ApiError(404, 'Bot not found', ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  let availableImages = [];
  let rejectedImages = [];
  let filteredResult = {};

  if (imageProcessingHelper.needsImageProcessing(data)) {
    try {
      filteredResult = await imageProcessingHelper.processPromptImages(
        data,
        companyID,
        botID
      );
      availableImages = filteredResult.available_images;
      rejectedImages = filteredResult.rejected_images;
    } catch (imageError) {
      logger.error(`Image processing failed: ${imageError.message}`);
    }
  }

  const dataToSave = {
    company_id: companyID,
    bot_id: botID,
    status: false,
    ...body,
    ...(availableImages.length || rejectedImages.length
      ? {
        metadata: {
          available_images: availableImages,
          rejected_images: rejectedImages,
        },
      }
      : {}),
  };

  const result = await repoPrompts.save(dataToSave);
  return { ...result, urlError: filteredResult?.error };
};

const updatePrompt = async (query, data) => {
  const { companyID, botID, promptID } = query;

  const [dataPrompt] = await repoPrompts.getByField({
    "prompts.company_id": companyID,
    "prompts.bot_id": botID,
    "prompts.uuid_unique": promptID,
  });
  if (!dataPrompt) {
    throw ApiError(404, 'Prompt not found', ErrorCodes.PROMPT_NOT_FOUND, { promptID });
  }

  let updatedMetadata = dataPrompt.metadata || {};
  let filteredResult = {};
  let dataAvailableImages = null;

  const needsProcessing =
    data.data &&
    imageProcessingHelper.needsImageProcessing(
      data.data,
      dataPrompt.metadata
    );

  if (needsProcessing) {
    try {
      filteredResult = await imageProcessingHelper.processPromptImages(
        data.data,
        companyID,
        botID
      );

      const newMetadata = { ...updatedMetadata };

      if (filteredResult.available_images?.length) {
        newMetadata.available_images = filteredResult.available_images;
      }

      if (filteredResult.rejected_images?.length) {
        newMetadata.rejected_images = filteredResult.rejected_images;
      }

      dataAvailableImages =
        JSON.stringify(newMetadata.available_images) || null;

      if (Object.keys(newMetadata).length > 0) {
        data.metadata = JSON.stringify(newMetadata);
      }
    } catch (imageError) {
      logger.error(`Image processing failed: ${imageError.message}`);
    }
  } else {
    const hasImageUrls = imageProcessingHelper.hasImageUrls(data.data);
    data.metadata = hasImageUrls
      ? dataPrompt.metadata
        ? JSON.stringify(dataPrompt.metadata)
        : null
      : null;

    dataAvailableImages =
      dataPrompt.metadata &&
      dataPrompt.metadata.available_images &&
      hasImageUrls
        ? JSON.stringify(dataPrompt.metadata.available_images) || null
        : null;
  }

  if (
    dataPrompt.status &&
    Object.prototype.hasOwnProperty.call(data, "status") &&
    data.status === false
  ) {
    const prompts = await repoPrompts.getByField({
      "prompts.company_id": companyID,
      "prompts.bot_id": botID,
      "prompts.type": dataPrompt.type,
    });

    const activePrompts = prompts.filter((p) => p.status === 1);
    if (activePrompts.length === 1) {
      throw ApiError(400, 'Active prompt required', ErrorCodes.PROMPT_NOT_FOUND, {});
    }
  }

  const fieldsToUpdate = ["name", "data", "status", "metadata"];
  const dataUpdate = {};

  fieldsToUpdate.forEach((field) => {
    if (data[field] !== undefined && data[field] !== dataPrompt[field]) {
      dataUpdate[field] = data[field];
    }
  });

  if (Object.keys(dataUpdate).length === 0) {
    return { success: true, urlError: filteredResult?.error };
  }

  const isActivatingPrompt = dataUpdate.status === true;
  const isUpdatingActivePromptData = dataPrompt.status && dataUpdate.data;

  if (isActivatingPrompt || isUpdatingActivePromptData) {
    const prompt = data.data || dataPrompt.data;
    const [instanceBotField] = await repoAWS.getInstanceBotsByField({
      "aws_instances_bots.bot_id": botID,
    });

    if (instanceBotField) {
      const botQueue = createBotQueue(botID);
      await sendDataToInstance(botQueue, BOT_EVENTS.UPDATE_PROMPT, {
        bot_id: botID,
        prompt,
        available_images: dataAvailableImages,
      });
    }
  }

  const result = await withTransaction(async (trx) => {
    if (isActivatingPrompt) {
      await repoPrompts.update(
        {
          "prompts.company_id": companyID,
          "prompts.bot_id": botID,
          "prompts.type": dataPrompt.type,
          "prompts.status": true,
        },
        { status: false },
        { trx }
      );
    }

    return await repoPrompts.update(
      {
        "prompts.company_id": companyID,
        "prompts.bot_id": botID,
        "prompts.uuid_unique": promptID,
      },
      dataUpdate,
      { trx }
    );
  });

  return { success: result, urlError: filteredResult?.error };
};

const deletePrompt = async (query) => {
  const { botID, companyID, promptID } = query;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(404, 'Company not found', ErrorCodes.COMPANY_NOT_FOUND, { companyID });
  }

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
    "bots.company_id": companyID,
  });
  if (!botField) {
    throw ApiError(404, 'Bot not found', ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  const [promptField] = await repoPrompts.getByField({
    "prompts.uuid_unique": promptID,
    "prompts.company_id": companyID,
    "prompts.bot_id": botID,
  });
  if (!promptField) {
    throw ApiError(404, 'Prompt not found', ErrorCodes.PROMPT_NOT_FOUND, { promptID });
  }

  if (promptField.status) {
    throw ApiError(400, 'Cannot delete active prompt', ErrorCodes.PROMPT_DELETE_ACTIVE_DENIED, {});
  }

  const prompts = await repoPrompts.getByField({
    "prompts.company_id": companyID,
    "prompts.bot_id": botID,
    "prompts.type": promptField.type,
  });

  if (prompts.length === 1) {
    throw ApiError(400, 'Active prompt required', ErrorCodes.PROMPT_NOT_FOUND, {});
  }

  return await repoPrompts.delete({
    "prompts.company_id": companyID,
    "prompts.bot_id": botID,
    "prompts.uuid_unique": promptID,
  });
};

const assistancePrompt = async (query, body) => {
  const { question, answer, history } = body;
  const { botID, companyID } = query;

  let companyOpenAI,
    useOpenRouter = true;

  [companyOpenAI] = await repoCompany.getCompanyConfigByField({
    "company_configs.company_id": companyID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": "BRAIN_OPENROUTER_KEY",
  });

  if (!companyOpenAI || companyOpenAI?.data == "") {
    [companyOpenAI] = await repoCompany.getCompanyConfigByField({
      "company_configs.company_id": companyID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "OPENAI_KEY",
    });
    useOpenRouter = false;
  }

  if (!companyOpenAI || companyOpenAI?.data == "") {
    throw ApiError(400, 'AI not configured for bot', ErrorCodes.BOT_NOT_FOUND, {});
  }

  const openai = new OpenAI({
    ...(useOpenRouter && { baseURL: "https://openrouter.ai/api/v1" }),
    apiKey: companyOpenAI?.data,
  });

  const systemPrompt = await getAssistanceSystemPrompt();

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  if (history && history.length > 0) {
    messages.push(...history);
  }

  messages.push({
    role: "assistant",
    content: question,
  });

  messages.push({
    role: "user",
    content: answer,
  });

  const completion = await openai.chat.completions.create({
    messages,
    model: useOpenRouter ? "openrouter/auto" : "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0,
    ...(useOpenRouter && {
      usage: { include: true },
    }),
  });

  const content = completion.choices[0]?.message?.content || "";

  const totalTokens = completion.usage?.total_tokens || 0;

  if (totalTokens > 0) {
    await repoBot.saveBotUsedTokens({
      company_id: companyID,
      bot_id: botID,
      tokens: totalTokens,
      credits: 0,
      metadata: JSON.stringify({
        prompt_tokens: completion.usage.prompt_tokens || 0,
        completion_tokens: completion.usage.completion_tokens || 0,
        total_tokens: totalTokens,
        response_content: content,
      }),
      date: dayjs().format("YYYY-MM-DD"),
    });
  }

  return content;
};

const testPrompt = async (query, body) => {
  const { botID } = query;
  const { prompt, data, history } = body;

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
  });
  if (!botField) {
    throw ApiError(404, 'Bot not found', ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  let botOpenAI,
    useOpenRouter = true;

  [botOpenAI] = await repoCompany.getCompanyConfigByField({
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": "BRAIN_OPENROUTER_KEY",
  });

  if (!botOpenAI || botOpenAI?.data == "") {
    [botOpenAI] = await repoCompany.getCompanyConfigByField({
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "extension",
      "configs_templates.key": "OPENAI_KEY",
    });
    useOpenRouter = false;
  }

  if (!botOpenAI || botOpenAI.data == "") {
    throw ApiError(400, 'AI not configured for bot', ErrorCodes.BOT_NOT_FOUND, {});
  }

  let [botGPTModel] = await repoCompany.getCompanyConfigByField({
    "company_configs.bot_id": botID,
    "configs_templates.owner_type": "extension",
    "configs_templates.key": useOpenRouter
      ? "BRAIN_OPENROUTER_MODEL"
      : "GPT_MODEL",
  });

  if (!botGPTModel || botGPTModel.data == "") {
    if (useOpenRouter) {
      [botGPTModel] = await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": botID,
        "configs_templates.owner_type": "extension",
        "configs_templates.key": "BRAIN_OPENROUTER_USE_AUTO_ROUTER",
      });

      if (!botGPTModel || botGPTModel.data != "true") {
        throw ApiError(400, 'Model not configured for bot', ErrorCodes.BOT_NOT_FOUND, {});
      }

      botGPTModel = { data: "openrouter/auto" };
    } else {
      throw ApiError(400, 'Model not configured for bot', ErrorCodes.BOT_NOT_FOUND, {});
    }
  }

  const key = botOpenAI.data;
  const model = botGPTModel.data;

  const openai = new OpenAI({
    ...(useOpenRouter && { baseURL: "https://openrouter.ai/api/v1" }),
    apiKey: key,
  });
  const completion = await openai.chat.completions.create({
    messages: [
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "system",
        content: prompt,
      },
      {
        role: "user",
        content: data,
      },
    ],
    model,
    ...(useOpenRouter && {
      usage: {
        include: true,
      },
    }),
  });

  await repoBot.saveBotUsedTokens({
    company_id: botField.company_id,
    bot_id: botID,
    tokens: completion.usage.total_tokens,
    credits: completion.usage.cost || 0,
    metadata: JSON.stringify(completion.usage),
    date: dayjs().format("YYYY-MM-DD"),
  });

  return completion.choices[0].message.content;
};

module.exports = {
  listPrompts,
  getBackups,
  createPrompt,
  updatePrompt,
  deletePrompt,
  assistancePrompt,
  testPrompt,
};
