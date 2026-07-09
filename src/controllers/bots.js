require("dotenv").config();
const dayjs = require("dayjs");
const Joi = require("joi");
const modelsBots = require("../models/bots");
const modelCompany = require("../models/company");
const { repoDashLogs } = require("../repositories/dashboardLogs");
const repoBots = require("../repositories/bots");
const repoExtension = require("../repositories/extensions");
const { socialNetworksRepository } = require("../repositories/social");
const repoCompany = require("../repositories/company");
const repoAccounts = require("../repositories/accounts");
const { generateChangesMetadata } = require("../utils/generateChangesMetadata");
const { utilActionType, utilResourceType } = require("../utils/utilDashLogs");
const { createChatRoom } = require("../utils/socket/createRoomName");
const {
  updateEventBridgeRule,
  deleteEventBridgeRule,
} = require("../utils/eventBridgeService");
const { queueEventBridgeUpdate } = require("../utils/eventBridgeQueue");
const { groupConfigsByPrefix } = require("../utils/groupConfigsByPrefix");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const listBots = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string(),
      identifier: Joi.string()
        .optional()
        .pattern(/^(\+?\d{1,3}[-. ]?)?\(?\d{1,4}\)?[-. ]?\d{1,4}[-. ]?\d{1,9}$/)
        .messages({
          "string.pattern.base": "The phone number is not valid.",
        }),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.listBots({
      user: req.unique_token.user,
      ...req.query,
    });

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const listBotExtensions = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      unassigned: Joi.boolean().optional().default(false),
    });

    const { error: paramsError, value: validatedParams } =
      paramsSchema.validate(req.query);

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.listBotExtensions(validatedParams);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const createBOT = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().required(),
      networkID: Joi.string().required(),
      planID: Joi.string().guid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      instanceID: Joi.string().required(),
      bot_type: Joi.string().allow(null, "").default("0"),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelsBots.createBOT(req.query, req.body);

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Create,
      resource_type: utilResourceType.Bot,
      company_id: req?.query?.companyID,
      name: null,
      status: "success",
      metadata: {
        ...req.body,
        company_id: req?.query?.companyID,
      },
    });

    res.status(201).json({
      code: 201,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const updateBot = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().required(),
      botID: Joi.string().required(),
    });

    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      name: Joi.string(),
      description: Joi.string().allow(""),
      photo: Joi.string()
        .pattern(/^data:image\/[^;]+;base64,/)
        .custom((value, helpers) => {
          const base64String = value.split(",")[1];
          const { error } = Joi.string().base64().validate(base64String);
          if (error) {
            return helpers.message("Invalid base64 string");
          }
        })
        .allow(""),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": req.query.botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${req.query.botID} not found.`);
    }

    const { company_id, name, uuid_unique: botID } = botField;

    const oldBot = { ...botField };
    delete oldBot.created_at;
    delete oldBot.updated_at;
    delete oldBot.id;

    const response = await modelsBots.updateBot(req.query, req.body);

    const botNewField = { ...oldBot, ...req.body };

    const changesMetadata = generateChangesMetadata(oldBot, botNewField);

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Update,
      resource_type: utilResourceType.Bot,
      name: name,
      company_id,
      status: "success",
      metadata: {
        changes: changesMetadata,
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
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const initializeBot = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.initializeBot(
      req.query,
      req.unique_token
    );

    const { botID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id, name } = botField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Initialize,
      resource_type: utilResourceType.Bot,
      name: name,
      company_id,
      status: "success",
      metadata: {
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
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const cancelInitializationBot = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.cancelInitializationBot(req.query);

    const { botID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id, name } = botField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.CancelInitialization,
      resource_type: utilResourceType.Bot,
      name: name,
      company_id,
      status: "success",
      metadata: {
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
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateBotEvent = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });

    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodyParams = Joi.object({
      identifier: Joi.string().allow(""),
    });

    const { error: bodyError } = bodyParams.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelsBots.updateBotEvent(req.query, req.body);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const sendMessageBot = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      accountID: Joi.string().uuid({ version: "uuidv4" }).optional(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const body = Joi.object({
      message: Joi.string().when("isMedia", {
        is: false,
        then: Joi.required(),
      }),
      media: Joi.array()
        .items(
          Joi.object({
            base64: Joi.string().required(),
            mimeType: Joi.string().required(),
            fileName: Joi.string().optional(),
            caption: Joi.string().optional(),
          })
        )
        .max(2)
        .when("isMedia", { is: true, then: Joi.required() }),
      phone: Joi.string().optional(),
      isMedia: Joi.boolean().default(false),
      groupName: Joi.string().optional(),
    }).xor("phone", "groupName");

    const { error: bodyError } = body.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelsBots.sendMessageBot(req.query, req.body);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getBotInfo = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.getBotInfo(req.query);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const stopBot = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { botID } = req.query;

    const response = await modelsBots.stopBot(req.query);

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id, name } = botField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Stop,
      resource_type: utilResourceType.Bot,
      name: name,
      company_id,
      status: "success",
      metadata: {
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
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteBot = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.deleteBot(req.query);

    const { botID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id, name } = botField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Delete,
      resource_type: utilResourceType.Bot,
      name: name,
      company_id,
      status: "success",
      metadata: {
        bot: { botID },
      },
    });

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const restartBot = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.restartBot(req.query);

    const { botID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id, name } = botField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Restart,
      resource_type: utilResourceType.Bot,
      name: name,
      company_id,
      status: "success",
      metadata: {
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
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const startBot = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.startBot(req.query);

    const { botID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const { company_id, name: botName } = botField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Start,
      resource_type: utilResourceType.Bot,
      name: botName,
      company_id,
      status: "success",
      metadata: {
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
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const saveBotExtension = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
      extensionID: Joi.string().required(),
    });
    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.saveBotExtension(req.query);

    const { botID, extensionID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [extensionField] = await repoExtension.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });

    if (!extensionField) {
      throw new Error(`Extension: ${extensionID} not found.`);
    }

    const { company_id, name: botName } = botField;
    const { name } = extensionField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Save,
      resource_type: utilResourceType.BotExtension,
      name: name,
      company_id,
      status: "success",
      metadata: {
        extension_id: req.query.extensionID,
        bot: {
          botID,
          botName,
        },
      },
    });

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
      message:
        "Bot extension saved successfully, the bot extension must be activated to be used.",
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const updateBotExtension = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
      extensionID: Joi.string().required(),
    });

    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodySchema = Joi.object({
      status: Joi.boolean(),
    });

    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelsBots.updateBotExtension(req.query, req.body);

    const { botID, extensionID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [extensionField] = await repoExtension.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });

    if (!extensionField) {
      throw new Error(`Extension: ${extensionID} not found.`);
    }

    const { company_id, name: botName } = botField;
    const { name } = extensionField;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Update,
      resource_type: utilResourceType.BotExtension,
      name: name,
      company_id,
      status: "success",
      metadata: {
        status: req.body.status,
        bot: {
          botName,
          botID,
          company_id,
        },
      },
    });

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const deleteBotExtension = async (req, res) => {
  try {
    const params = Joi.object({
      botID: Joi.string().required(),
      extensionID: Joi.string().required(),
    });

    const { error: paramsError } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.deleteBotExtension(req.query);

    const { botID, extensionID } = req.query;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot: ${botID} not found.`);
    }

    const [extensionField] = await repoExtension.getExtensionByField({
      "extensions.uuid_unique": extensionID,
    });

    if (!extensionField) {
      throw new Error(`Extension: ${extensionID} not found.`);
    }

    const { company_id, name: botName } = botField;
    const { uuid_unique: extension_id, name: extensionName } = extensionField;

    delete botField.created_at;
    delete botField.updated_at;
    delete botField.id;

    await repoDashLogs.save({
      user_id: req?.unique_token?.user,
      action_type: utilActionType.Delete,
      resource_type: utilResourceType.BotExtension,
      name: botName,
      company_id,
      status: "success",
      metadata: {
        bot: { botID },
        extension: {
          extension_id,
          extensionName,
        },
      },
    });

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getOpenaiCosts = async (req, res) => {
  try {
    const queryParams = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError } = queryParams.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const bodyParams = Joi.object({
      start_time: Joi.number().required(),
      end_time: Joi.number().optional(),
    });

    const { error: bodyError } = bodyParams.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const response = await modelsBots.getOpenaiCosts(req.query, req.body);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getBotSummary = async (req, res) => {
  try {
    const params = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      type: Joi.string().valid("DAILY", "RANGE").required(),
      from: Joi.string().required(),
      to: Joi.string().optional(),
      detailed: Joi.boolean().default(false),
    }).when(Joi.object({ type: Joi.string().valid("RANGE") }).unknown(), {
      then: Joi.object({
        from: Joi.string().required(),
        to: Joi.string().required(),
      }),
      otherwise: Joi.object({
        from: Joi.string().required(),
      }),
    });

    const { error: paramsError, value: validatedParams } = params.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.getBotSummary(validatedParams);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

const getBotUsedTokens = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      fromDate: Joi.number().required(),
      toDate: Joi.number().optional(),
    });

    const { error: paramsError } = paramsSchema.validate(req.query);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const response = await modelsBots.getBotUsedTokens(req.query);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const socketSendMessageBot = async (data, socket) => {
  try {
    const schema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      accountID: Joi.string().uuid({ version: "uuidv4" }).required(),
      message: Joi.string().when("isMedia", {
        is: false,
        then: Joi.required(),
      }),
      media: Joi.array()
        .items(
          Joi.object({
            base64: Joi.string().required(),
            mimeType: Joi.string().required(),
            fileName: Joi.string().optional(),
            caption: Joi.string().optional(),
          })
        )
        .max(2)
        .when("isMedia", { is: true, then: Joi.required() }),
      phone: Joi.string()
        .pattern(/^\d{10,15}$/)
        .required()
        .messages({
          "string.empty": "Phone number is required.",
          "string.pattern.base":
            "Phone number must be a valid international number.",
        }),
      isMedia: Joi.boolean().default(false),
    });

    const { error: paramsError } = schema.validate(data);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { botID, accountID, ...body } = data;

    await modelsBots.sendMessageBot({ botID, accountID }, body, {
      useSocket: true,
    });
  } catch (error) {
    socket.emit("message:error", {
      success: false,
      error: error.message,
    });
  }
};

const socketUpdateChatAgent = async (data, socket) => {
  try {
    const schema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      accountID: Joi.string().uuid({ version: "uuidv4" }).required(),
      phoneNumber: Joi.string().required(),
      action: Joi.string().valid("claim", "release").required(),
    });

    const { error: paramsError } = schema.validate(data);
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { companyID, botID, accountID, phoneNumber, action } = data;

    await modelsBots.updateChatAgent(
      { companyID, botID, accountID },
      { phoneNumber, action }
    );

    const event = action === "claim" ? "chat:claimed" : "chat:released";
    const room = createChatRoom(accountID, phoneNumber);

    if (action == "claim" && !socket.rooms.has(room)) {
      socket.join(room);
    } else if (action == "release" && socket.rooms.has(room)) {
      socket.leave(room);
    }

    socket.emit(event, {
      success: true,
      timestamp: dayjs().valueOf(),
    });
  } catch (error) {
    socket.emit("chat:error", {
      success: false,
      error: error.message,
    });
  }
};

const socketAvailableChat = async (data, socket) => {
  try {
    const schema = Joi.object({
      companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      phoneNumber: Joi.string()
        .pattern(/^\d{10,15}$/)
        .required()
        .messages({
          "string.empty": "Phone number is required.",
          "string.pattern.base":
            "Phone number must be a valid international number without (+).",
        }),
    });

    const { error: validationError } = schema.validate(data);
    if (validationError) {
      throw new Error(validationError.details[0].message);
    }

    const response = await modelsBots.socketAvailableChat(data);

    const { botID, phoneNumber, userData } = response;

    socket.emit("chat:availability_status", {
      success: true,
      phoneNumber,
      botID,
      assignedTo: userData,
      isAvailable: !userData,
      timestamp: dayjs().valueOf(),
    });
  } catch (error) {
    console.error("Error checking chat availability status:", error);
    socket.emit("chat:availability_status", {
      success: false,
      phoneNumber: data?.phoneNumber,
      botID: data?.botID,
      error: error.message,
      timestamp: dayjs().valueOf(),
    });
  }
};

const injectMetaWebhookConfig = (activations, botID, companyID) => {
  const META_PROVIDER_KEY = "meta";
  const WEBHOOK_TEMPLATE_KEY = "WHATSAPP_WEBHOOK_URL";

  const processActivations = (activationList) => {
    return activationList.map((activation) => {
      if (activation.provider_key === META_PROVIDER_KEY) {
        const webhookUrl = `https://${
          process.env?.WHATSAPP_WEBHOOK_URL || "coftech-backend-meta.coftechservices.com"
        }/webhooks/meta/${botID}`;

        const metaWebhookConfig = {
          key: WEBHOOK_TEMPLATE_KEY,
          data: webhookUrl,
          internal: 1,
          data_type: "string",
          description:
            "WhatsApp Webhook URL endpoint for receiving messages and events",
          template_id: null,
          company_config_id: companyID,
        };

        const updatedConfigs = activation.provider_configs
          ? [...activation.provider_configs, metaWebhookConfig]
          : [metaWebhookConfig];

        return {
          ...activation,
          provider_configs: updatedConfigs,
        };
      }
      return activation;
    });
  };

  if (Array.isArray(activations)) {
    return processActivations(activations);
  }

  return processActivations([activations])[0];
};

const getBotSocialNetworkActivations = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError, value: validatedParams } =
      paramsSchema.validate(req.query);

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { botID } = validatedParams;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: `Bot "${botID}" not found.`,
      });
    }

    const { company_id } = botField;

    const query = {
      "bot_social_network_activations.bot_id": botID,
    };

    const response = await repoBots.getBotSocialNetworkActivationsWithConfigs(
      query
    );

    const processedResponse = injectMetaWebhookConfig(
      response,
      botID,
      company_id
    );

    res.status(200).json({
      code: 200,
      status: true,
      data: processedResponse,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const updateBotSocialNetworkActivation = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      networkID: Joi.string().uuid({ version: "uuidv4" }).required(),
      providerID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError, value: validatedParams } =
      paramsSchema.validate(req.query);

    if (paramsError) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: paramsError.details[0].message,
      });
    }

    const { botID, networkID, providerID } = validatedParams;

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: `Bot "${botID}" not found.`,
      });
    }

    const { company_id } = botField;

    const [networkField] = await socialNetworksRepository.getByField(
      { "social_networks.uuid_unique": networkID },
      {
        includeProviders: true,
      }
    );

    if (!networkField) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: `Network "${networkID}" not found.`,
      });
    }

    const isProviderRelated = networkField.providers?.some(
      (p) => p.uuid_unique === providerID
    );

    if (!isProviderRelated) {
      return res.status(400).json({
        code: 400,
        status: false,
        message: `Provider "${providerID}" is not related to Network "${networkID}".`,
      });
    }

    await modelsBots.updateBotSocialNetworkActivation(validatedParams);

    const whereClause = {
      "bot_social_network_activations.bot_id": botID,
      "bot_social_network_activations.social_network_id": networkID,
      "bot_social_network_activations.sn_provider_id": providerID,
    };

    const [updatedActivation] =
      await repoBots.getBotSocialNetworkActivationsWithConfigs(whereClause);

    const finalActivation = injectMetaWebhookConfig(
      updatedActivation,
      botID,
      company_id
    );

    return res.status(200).json({
      code: 200,
      status: true,
      data: finalActivation,
    });
  } catch (error) {
    return res.status(500).json({
      code: 500,
      status: false,
      message: error.message,
    });
  }
};

const getBotConfigs = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      configID: Joi.string().uuid({ version: "uuidv4" }).optional(),
    });

    const { error: paramsError, value: validatedParams } =
      paramsSchema.validate(req.query);

    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { botID, configID } = validatedParams;
    const { user } = req.unique_token;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: `User ${user} not found.`,
      });
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      throw new Error(`Bot ${botID} not found`);
    }

    const { company_id: botCompany } = botField;
    const { role_key, company_id: accountCompany } = accountField;

    if (role_key !== "SUPERADMIN" && accountCompany !== botCompany) {
      return res.status(403).json({
        code: 403,
        status: false,
        message: `You do not have permission to access this bot.`,
      });
    }

    let response = await repoCompany.getCompanyConfigByField({
      "company_configs.bot_id": botID,
      "configs_templates.owner_type": "bot",
      ...(configID && { "company_configs.uuid_unique": configID }),
    });

    response = groupConfigsByPrefix(response, botCompany, botID);

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const updateBotConfig = async (req, res) => {
  try {
    const paramsSchema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      configID: Joi.string().uuid({ version: "uuidv4" }).required(),
    });

    const { error: paramsError, value: paramsValues } = paramsSchema.validate(
      req.query
    );
    if (paramsError) {
      throw new Error(paramsError.details[0].message);
    }

    const { botID, configID } = paramsValues;

    const bodySchema = Joi.object({
      data: Joi.string().allow("", null),
    });
    const { error: bodyError } = bodySchema.validate(req.body);
    if (bodyError) {
      throw new Error(bodyError.details[0].message);
    }

    const { user } = req.unique_token;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      throw new Error(`User ${user} not found`);
    }

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": botID,
    });

    if (!botField) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: `Bot "${botID}" not found.`,
      });
    }

    const { company_id: botCompany } = botField;
    const { role_key, company_id: accountCompany } = accountField;

    if (role_key !== "SUPERADMIN" && accountCompany !== botCompany) {
      return res.status(403).json({
        code: 403,
        status: false,
        message: `You do not have permission to access this bot.`,
      });
    }

    const [configField] = await repoCompany.getCompanyConfigByField({
      "company_configs.uuid_unique": configID,
      "company_configs.bot_id": botID,
    });

    if (!configField) {
      return res.status(404).json({
        code: 404,
        status: false,
        message: `Configuration "${configID}" not found for Bot "${botID}".`,
      });
    }

    const { company_id } = botField;
    const { template_key } = configField;
    const { first_name, last_name } = accountField;
    const fullName = `${first_name} ${last_name}`;
    const updated_by = fullName;

    const query = {
      companyID: company_id,
      botID,
    };

    const body = {
      data: req.body.data,
      key: template_key,
      updated_by,
    };

    const response = await modelCompany.updateCompanyConfigs(query, body);

    const EVENTBRIDGE_KEYS = [
      "WEEKLY_REPORT_ENABLED",
      "WEEKLY_REPORT_CRON",
      "WEEKLY_REPORT_WHATSAPP_GROUP",
      "BOT_TIMEZONE",
    ];

    if (EVENTBRIDGE_KEYS.includes(template_key)) {
      if (
        req.body.data === "false" &&
        template_key === "WEEKLY_REPORT_ENABLED"
      ) {
        await deleteEventBridgeRule(botID);
      } else {
        const [enabledConfig] = await repoCompany.getCompanyConfigByField({
          "configs_templates.key": "WEEKLY_REPORT_ENABLED",
          "company_configs.bot_id": botID,
        });

        if (enabledConfig?.data === "true") {
          const [cronConfig] = await repoCompany.getCompanyConfigByField({
            "configs_templates.key": "WEEKLY_REPORT_CRON",
            "company_configs.bot_id": botID,
          });
          const [groupConfig] = await repoCompany.getCompanyConfigByField({
            "configs_templates.key": "WEEKLY_REPORT_WHATSAPP_GROUP",
            "company_configs.bot_id": botID,
          });
          const [timezoneConfig] = await repoCompany.getCompanyConfigByField({
            "configs_templates.key": "BOT_TIMEZONE",
            "company_configs.bot_id": botID,
          });

          const configs = {
            cron:
              template_key === "WEEKLY_REPORT_CRON"
                ? req.body.data
                : cronConfig?.data,
            groupName:
              template_key === "WEEKLY_REPORT_WHATSAPP_GROUP"
                ? req.body.data
                : groupConfig?.data,
            timezone:
              template_key === "BOT_TIMEZONE"
                ? req.body.data
                : timezoneConfig?.data,
          };

          if (configs.cron && configs.groupName && configs.timezone) {
            await queueEventBridgeUpdate(botID, async () => {
              await updateEventBridgeRule({
                botID,
                groupName: configs.groupName,
                companyID: company_id,
                timezone: configs.timezone,
                cron: configs.cron,
              });
            });
          }
        }
      }
    }

    const { name } = accountField;

    await repoDashLogs.save({
      user_id: user,
      action_type: utilActionType.Update,
      resource_type: utilResourceType.CompanyConfig,
      name: name,
      status: "success",
      company_id,
      metadata: {
        ...req.body,
        company: {
          companyID: company_id,
        },
      },
    });

    res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (e) {
    res.status(500).json({
      code: 500,
      status: false,
      data: e,
      message: e.message,
    });
  }
};

const getBotActiveHours = async (req, res) => {
  try {
    const querySchema = Joi.object({
      botID: Joi.string().uuid({ version: "uuidv4" }).required(),
      startDate: Joi.string().isoDate().required(),
      endDate: Joi.string()
        .isoDate()
        .optional()
        .custom((value, helpers) => {
          const { startDate } = helpers.state.ancestors[0];
          if (value && startDate && new Date(value) < new Date(startDate)) {
            return helpers.message("endDate cannot be earlier than startDate");
          }
          return value;
        }),
      page: Joi.number().integer().min(1).optional().default(1),
      pageSize: Joi.number().integer().min(1).max(100).optional().default(10),
    });

    const queryValue = await validateOrThrow(querySchema, req.query);

    const response = await repoBots.getBotActiveHoursByField(queryValue);

    return res.status(200).json({
      code: 200,
      status: true,
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      status: false,
      data: error,
      message: error.message,
    });
  }
};

module.exports = {
  listBots,
  listBotExtensions,
  createBOT,
  updateBot,
  initializeBot,
  cancelInitializationBot,
  updateBotEvent,
  sendMessageBot,
  getBotInfo,
  stopBot,
  deleteBot,
  restartBot,
  startBot,
  saveBotExtension,
  updateBotExtension,
  deleteBotExtension,
  getOpenaiCosts,
  getBotSummary,
  getBotUsedTokens,
  socketSendMessageBot,
  socketUpdateChatAgent,
  socketAvailableChat,
  getBotSocialNetworkActivations,
  updateBotSocialNetworkActivation,
  getBotConfigs,
  updateBotConfig,
  getBotActiveHours,
};
