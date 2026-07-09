const {
  socialContactsRepository,
  socialMessagesQueueRepository,
  socialMessagesRepository,
  socialNetworksRepository,
} = require("../repositories/social");
const repoCompany = require("../repositories/company");
const repoBots = require("../repositories/bots");
const { validateEmail } = require("../utils/validateEmail");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");

const saveMessage = async (data, body, filterData = {}) => {
  const { companyID, networkID, event = "new_message" } = data;

  if (
    ![
      "new_message",
      "message_create",
      "message_edit",
      "message_revoked",
    ].includes(event)
  ) {
    throw ApiError(
      404,
      "Event not found",
      ErrorCodes.WHATSAPP_EVENT_NOT_FOUND,
      {
        event,
      }
    );
  }

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
      companyID,
    });
  }

  const [networkField] = await socialNetworksRepository.getByField({
    "social_networks.uuid_unique": networkID,
  });
  if (!networkField) {
    throw ApiError(404, "Network not found", ErrorCodes.NETWORK_NOT_FOUND, {
      networkID,
    });
  }

  return await socialMessagesRepository.save(
    {
      "social_messages.company_id": companyID,
      "social_messages.network_id": networkID,
      ...body,
      ...(filterData?.update_create_at && {
        "social_messages.created_at": filterData.update_create_at,
      }),
    },
    { event }
  );
};

const saveMessageQueue = async (
  botID,
  message,
  message_type,
  networkID,
  from
) => {
  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
  });
  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, {
      botID,
    });
  }

  const [networkField] = await socialNetworksRepository.getByField({
    "social_networks.key": networkID,
  });
  if (!networkField) {
    throw ApiError(404, "Network not found", ErrorCodes.NETWORK_NOT_FOUND, {
      networkID,
    });
  }

  return await socialMessagesQueueRepository.save({
    "social_messages_queue.bot_id": botID,
    "social_messages_queue.network_id": networkField.uuid_unique,
    "social_messages_queue.message": message,
    "social_messages_queue.message_type": message_type,
    "social_messages_queue.sender": from,
  });
};

const getContactEmail = async (phone) => {
  const {
    result: [contactField],
  } = await socialContactsRepository.getByField({
    "social_contacts.contact_id": phone,
  });
  if (!contactField) {
    throw ApiError(404, "Contact not found", ErrorCodes.CONTACT_NOT_FOUND, {
      phone,
    });
  }
  const { metadata } = contactField;
  return metadata?.email;
};

const saveContactEmail = async (data) => {
  const { phone, email } = data;

  const {
    result: [contactField],
  } = await socialContactsRepository.getByField({
    "social_contacts.contact_id": phone,
  });
  if (!contactField) {
    throw ApiError(404, "Contact not found", ErrorCodes.CONTACT_NOT_FOUND, {
      phone,
    });
  }
  const { uuid_unique: contactID, metadata } = contactField;

  if (metadata?.email !== email && email) {
    await socialContactsRepository.update(
      {
        "social_contacts.uuid_unique": contactID,
      },
      {
        metadata: JSON.stringify({
          ...metadata,
          email,
        }),
      }
    );
  }
  return true;
};

const checkContactEmail = async (phone, email) => {
  const userHasEmail = await getContactEmail(phone);
  let response = {
    message: "",
    emailRequired: false,
    emailValid: true,
    userEmail: userHasEmail,
  };

  if (!userHasEmail) {
    if (!email) {
      response.message = "Email is required";
      response.emailRequired = true;
      return response;
    }
    const isEmailValid = validateEmail(email);
    if (!isEmailValid) {
      response.message = "Email is not valid";
      response.emailValid = false;
      return response;
    }
    await saveContactEmail({ phone, email });
  }
  return response;
};

const getMessages = async (query) => {
  const {
    companyID,
    botID,
    contactID,
    page,
    limit,
    orderDirection,
    networkID,
  } = query;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(404, "Company not found", ErrorCodes.COMPANY_NOT_FOUND, {
      companyID,
    });
  }

  const [botField] = await repoBots.getBotsByField({
    "bots.uuid_unique": botID,
  });
  if (!botField) {
    throw ApiError(404, "Bot not found", ErrorCodes.BOT_NOT_FOUND, {
      botID,
    });
  }

  const {
    result: [contactField],
  } = await socialContactsRepository.getByField({
    "social_contacts.uuid_unique": contactID,
  });
  if (!contactField) {
    throw ApiError(404, "Contact not found", ErrorCodes.CONTACT_NOT_FOUND, {
      contactID,
    });
  }

  if (botField.identifier.trim() == "" || botField.identifier == null) {
    throw ApiError(
      400,
      "Bot identifier is empty",
      ErrorCodes.BOT_EMPTY_IDENTIFIER
    );
  }

  const {
    result: [contactBot],
  } = await socialContactsRepository.getByField({
    "social_contacts.contact_id": botField.identifier,
  });
  if (!contactBot) {
    throw ApiError(
      404,
      "Contact not found",
      ErrorCodes.BOT_INCORRECT_IDENTIFIER,
      {
        identifier: botField.identifier,
      }
    );
  }

  const filters = { "vw_social_messages_final.client_id": botID };
  if (networkID) {
    filters["vw_social_messages_final.network_id"] = networkID;
  }
  if (botField.provider_id) {
    filters["vw_social_messages_final.sn_provider_id"] = botField.provider_id;
  }

  return await socialMessagesRepository.getByField(filters, {
    page,
    limit,
    orderBy: "vw_social_messages_final.created_at",
    orderDirection,
    contact1: contactBot.contact_id,
    contact2: contactField.contact_id,
  });
};

const getLastConversationMessages = async (
  contact1,
  contact2,
  botID,
  limit
) => {
  const rawMessages =
    await socialMessagesRepository.getLastConversationMessages(
      contact1,
      contact2,
      botID,
      limit
    );

  if (!rawMessages || rawMessages.length === 0) {
    return [];
  }

  const formattedMessages = rawMessages.reverse().map((msg) => {
    const formatted = {
      id: {
        fromMe: msg.sender === contact2,
        remote: msg.sender === contact2 ? msg.to_send : msg.sender,
        id: msg.message_id,
        _serialized: msg.uuid_unique,
      },
      body: msg.body || "",
      type: msg.type === "text" ? "chat" : msg.type,
      timestamp: msg.timestamp,
      from: msg.sender,
      to: msg.to_send,
    };

    if (msg.caption) {
      formatted.caption = msg.caption;
    }

    if (
      (msg.type === "audio" || msg.type === "ptt") &&
      msg.metadata?.duration
    ) {
      formatted.duration = msg.metadata.duration;
    }

    if (msg.metadata) {
      formatted.metadata = msg.metadata;

      if (["image", "audio", "ptt", "document"].includes(msg.type)) {
        formatted.hasMedia = true;
        formatted.media = {
          data: msg.body,
          mimetype: msg.metadata.mimetype || "",
          filename: msg.metadata.filename || null,
          filesize: msg.metadata.filesize || 0,
        };
      }
    }

    return formatted;
  });

  return formattedMessages;
};

module.exports = {
  getMessages,
  saveMessage,
  saveMessageQueue,
  saveContactEmail,
  getContactEmail,
  checkContactEmail,
  getLastConversationMessages,
};
