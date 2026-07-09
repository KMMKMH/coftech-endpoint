const Joi = require("joi");
const modelsSocial = require("../models/social");
const {
  socialNetworksRepository,
  socialNetworksProvidersRepository,
  latestContactsMessageRepository,
} = require("../repositories/social");
const repoCompany = require("../repositories/company");
const repoBot = require("../repositories/bots");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const { validateOrThrow } = require("../utils/middleware/joiValidator");

const getMessagesLatest = async (req, res) => {
  const availableProviders = new Set(["web-whatsapp", "baileys", "meta"]);
  const availableNetworks = new Set(["WHATSAPP", "INSTAGRAM", "TELEGRAM"]);

  const params = Joi.object({
    companyID: Joi.string().guid({ version: "uuidv4" }).required(),
    botID: Joi.string().guid({ version: "uuidv4" }).required(),
    networkID: Joi.alternatives()
      .try(
        Joi.string().valid(...availableNetworks).insensitive(),
        Joi.string().guid({ version: "uuidv4" }),
      )
      .optional(),
    snProviderID: Joi.alternatives()
      .try(
        Joi.string().valid(...availableProviders).insensitive(),
        Joi.string().guid({ version: "uuidv4" }),
      )
      .optional(),
  });

  const valueQuery = validateOrThrow(params, req.query);

  let { companyID, botID, networkID, snProviderID } = valueQuery;

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
  });
  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, { botID });
  }

  if (networkID) {
    const query = availableNetworks.has(networkID)
      ? { "social_networks.key": networkID }
      : { "social_networks.uuid_unique": networkID };

    const [networkField] = await socialNetworksRepository.getByField(query);
    if (!networkField) {
      throw ApiError(404, "Network not found", ErrorCodes.NETWORK_NOT_FOUND, {
        networkID,
      });
    }
    networkID = networkField.uuid_unique;
  }

  if (snProviderID) {
    const query = availableProviders.has(snProviderID)
      ? { "social_networks_providers.key": snProviderID }
      : { "social_networks_providers.uuid_unique": snProviderID };

    const [snProviderField] =
      await socialNetworksProvidersRepository.getByField(query);
    if (!snProviderField) {
      throw ApiError(
        404,
        "Social network provider not found",
        ErrorCodes.SOCIAL_NETWORK_PROVIDER_NOT_FOUND,
        {
          provider: snProviderID,
        }
      );
    }
    snProviderID = snProviderField.uuid_unique;
  }

  const response = await latestContactsMessageRepository.getByField(
    {
      "latest_contacts_message.company_id": companyID,
      "latest_contacts_message.client_id": botID,
      ...(networkID && { "latest_contacts_message.network_id": networkID }),
      ...(snProviderID && {
        "latest_contacts_message.sn_provider_id": snProviderID,
      }),
    },
    {
      limit: 30,
      orderDirection: "DESC",
      orderBy: "latest_message_time",
    }
  );

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const saveMessages = async (req, res) => {
  const paramsSchema = Joi.object({
    companyID: Joi.string().guid({ version: "uuidv4" }).required(),
    networkID: Joi.string().guid({ version: "uuidv4" }).required(),
  });

  const valueQuery = validateOrThrow(paramsSchema, req.query);

  const bodySchema = Joi.object({
    is_group: Joi.boolean().required(),
    is_broadcast: Joi.boolean().required(),
    body: Joi.string(),
    data: Joi.string(),
    type: Joi.string(),
    sender: Joi.string(),
    via: Joi.string(),
    to_send: Joi.string(),
    message_id: Joi.string(),
    author: Joi.string(),
    extra1: Joi.string(),
    extra2: Joi.string(),
    extra3: Joi.string(),
  });

  const valueBody = validateOrThrow(bodySchema, req.body);

  const response = await modelsSocial.saveMessage(valueQuery, valueBody);

  res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const getSocialNetwork = async (req, res) => {
  const queryParams = Joi.object({
    includeProviders: Joi.bool().default(false),
    networkKey: Joi.string().optional().allow(null, ""),
    networkID: Joi.string()
      .guid({ version: "uuidv4" })
      .optional()
      .allow(null, ""),
  });

  const valueQuery = validateOrThrow(queryParams, req.query);

  const { includeProviders, networkKey, networkID } = valueQuery;

  const query = {
    ...(networkID ? { ["social_networks.uuid_unique"]: networkID } : {}),
    ...(networkKey ? { ["social_networks.key"]: networkKey } : {}),
  };

  const response = await socialNetworksRepository.getByField(query, {
    isRaw: false,
    includeProviders,
  });

  if (!response.length) {
    return res.status(404).json({
      code: 404,
      status: false,
      message: `Social Network${networkKey ? ` with key "${networkKey}"` : ""}${
        networkID ? ` and ID "${networkID}"` : ""
      } not found.`,
    });
  }

  return res.status(200).json({
    code: 200,
    status: true,
    data: response,
  });
};

const getLastConversationMessages = async (req, res) => {
  const queryParams = Joi.object({
    companyID: Joi.string().uuid({ version: "uuidv4" }).required(),
    botID: Joi.string().uuid({ version: "uuidv4" }).required(),
    networkKey: Joi.string().required(),
    snProviderKey: Joi.string().required(),
    contact1: Joi.string().required(),
    contact2: Joi.string().required(),
    limit: Joi.number().integer().min(1).max(20).default(5),
  });

  const valueQuery = validateOrThrow(queryParams, req.query);

  const {
    companyID,
    botID,
    networkKey,
    snProviderKey,
    contact1,
    contact2,
    limit,
  } = valueQuery;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(
      404,
      `Company with ID '${companyID}' not found`,
      ErrorCodes.COMPANY_NOT_FOUND
    );
  }

  const [botField] = await repoBot.getBotsByField({
    "bots.uuid_unique": botID,
  });
  if (!botField) {
    throw ApiError(
      404,
      `Bot with ID '${botID}' not found`,
      ErrorCodes.BOT_NOT_FOUND
    );
  }

  const [networkField] = await socialNetworksRepository.getByField({
    "social_networks.key": networkKey,
  });
  if (!networkField) {
    throw ApiError(
      404,
      `Social network with key '${networkKey}' not found`,
      ErrorCodes.SOCIAL_NETWORK_NOT_FOUND
    );
  }

  const { uuid_unique: networkID } = networkField;

  const [providerField] = await socialNetworksProvidersRepository.getByField({
    "social_networks_providers.social_network_id": networkID,
    "social_networks_providers.key": snProviderKey,
  });
  if (!providerField) {
    throw ApiError(
      404,
      `Social provider with key '${snProviderKey}' not found`,
      ErrorCodes.SOCIAL_NETWORK_PROVIDER_NOT_FOUND
    );
  }

  const { uuid_unique: providerID } = providerField;

  const [activationProviderField] =
    await repoBot.getBotSocialNetworkActivations({
      "bot_social_network_activations.bot_id": botID,
      "bot_social_network_activations.social_network_id": networkID,
      "bot_social_network_activations.sn_provider_id": providerID,
    });
  if (!activationProviderField) {
    throw ApiError(
      400,
      `The bot with ID '${botID}' has not activated the social network`,
      ErrorCodes.BOT_SOCIAL_NETWORK_NOT_ACTIVATED
    );
  }

  const messages = await modelsSocial.getLastConversationMessages(
    contact1,
    contact2,
    botID,
    limit
  );

  if (!messages || messages.length === 0) {
    return res.status(200).json({
      code: 200,
      status: true,
      message: `No messages found between ${contact1} and ${contact2}`,
      data: [],
    });
  }

  return res.status(200).json({
    code: 200,
    status: true,
    message: `Found ${messages.length} messages`,
    data: messages,
  });
};

module.exports = {
  saveMessages,
  getMessagesLatest,
  getSocialNetwork,
  getLastConversationMessages,
};
