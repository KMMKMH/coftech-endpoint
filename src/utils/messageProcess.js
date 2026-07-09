const dayjs = require("dayjs");
const parsePhoneNumber = require("libphonenumber-js");
const logger = require("./logger");
const modelsSocial = require("../models/social");
const repoBots = require("../repositories/bots");
const {
  socialNetworksProvidersRepository,
  socialContactsRepository,
} = require("../repositories/social");

const { getSocket } = require("./socket/socket");
const { createChatRoom } = require("./socket/createRoomName");
const { formatFileSize } = require("./filer_size");
const MessageExtractorFactory = require("./extractors/MessageExtractorFactory");

function formatName(name) {
  if (!name) return;
  let formattedName = name.replace(/[^a-zA-Z\s]/g, "");
  formattedName = formattedName
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim()
    .replace(/\s+/g, " ");
  return formattedName;
}

/**
 * Determines the message source based on the payload
 * @param {Object} dataClient - Client/message data
 * @returns {string} The message source ('meta', etc.)
 */
async function messageProcess(dataClient, botID, filterData = {}) {
  try {
    dataClient.bot_id = botID;

    const extractor = MessageExtractorFactory.createExtractor(
      dataClient,
      dataClient.source
    );

    const messageId = extractor.extractMessageId();
    const body = await extractor.extractBody();
    const type = extractor.extractType();
    const sender = extractor.extractSender();
    const recipient = extractor.extractRecipient();
    const author = extractor.extractAuthor();
    const direction = extractor.extractDirection();
    const isGroup = extractor.isGroupMessage();
    const isBroadcast = extractor.isBroadcastMessage();
    const isMetaIA = extractor.isSpecialBotMessage();
    const contactInfo = extractor.extractContactInfo();
    const extraData = await extractor.extractExtraData();

    const [botField] = await repoBots.getBotsByField({
      "bots.uuid_unique": dataClient.bot_id || botID,
    });

    if (!botField) {
      throw new Error(`Bot not found with ID: ${dataClient.bot_id || botID}`);
    }

    const [socialNetworkProvider] =
      await socialNetworksProvidersRepository.getByField({
        "social_networks_providers.key": dataClient.source,
      });

    if (!socialNetworkProvider) {
      throw new Error(
        `Social network provider not found for key: ${dataClient.source}`
      );
    }

    const company_id = botField.company_id;
    const network_id = socialNetworkProvider.social_network_id;
    const provider_id = socialNetworkProvider.uuid_unique;
    const client_id = dataClient.bot_id || botID;

    if (!sender && direction === "receive") {
      logger.warn("Message without sender detected", { messageId, type });
      return null;
    }

    if (
      dataClient.source === "web-whatsapp" &&
      !extractor.shouldProcessMessage()
    ) {
      return null;
    }

    let extra1 = {};
    let extra2 = {};
    let extra3 = {};

    if (extraData.caption) {
      extra1.caption = extraData.caption;
    }

    if (extraData.location) {
      extra1.location = extraData.location;
    }

    if (extraData.event) {
      extra1.event = extraData.event;
    }

    if (extraData.contact) {
      extra1.contact = extraData.contact;
    }

    if (extraData.quoted) {
      extra1.quoted = extraData.quoted;
    }

    if (extraData.edited) {
      extra1.edited = extraData.edited;
    }

    if (extraData.revoked) {
      extra2.revoked = extraData.revoked;
    }

    if (isMetaIA) {
      extra3.is_meta_ia = true;
    }

    if (isGroup) {
      extra3.group_id = extraData.group_id;
    }

    const dataToSave = {
      client_id,
      message_id: messageId,
      body,
      type,
      data: {
        ...dataClient.data,
        extraData: {
          mediaData: extraData.media,
          contactInfo,
          isGroup,
        },
      },
      sender,
      via: direction,
      to_send: recipient,
      author,
      is_group: isGroup,
      is_broadcast: isBroadcast,
      extra1: Object.keys(extra1).length > 0 ? extra1 : null,
      extra2: Object.keys(extra2).length > 0 ? extra2 : null,
      extra3: Object.keys(extra3).length > 0 ? extra3 : null,
      sn_provider_id: provider_id,
    };

    const messageData = await modelsSocial.saveMessage(
      { companyID: company_id, networkID: network_id, event: dataClient.event },
      dataToSave,
      filterData
    );

    if (!messageData) {
      logger.error("messageData is undefined after saveMessage", {
        event: dataClient.event,
        botID,
        dataToSave,
      });
      return;
    }

    messageData.created_at = dayjs(messageData.created_at).valueOf();

    if (
      sender &&
      !isGroup &&
      !isBroadcast &&
      messageData &&
      direction === "receive"
    ) {
      await handleIncomingMessageSocket(
        botID,
        sender,
        messageData,
        dataClient.event
      );
    } else if (messageData && direction === "send") {
      await handleOutgoingMessageSocket(botID, recipient, messageData);
    }

    if (contactInfo && Object.keys(contactInfo).length > 0) {
      await handleContactManagement(
        sender,
        network_id,
        direction,
        contactInfo,
        dataClient.client
      );
    }

    return dataToSave;
  } catch (error) {
    logger.error("Error in messageProcess:", {
      error: error.message,
      stack: error.stack,
      botID,
      dataClient: JSON.stringify(dataClient, null, 2).substring(0, 1000),
    });
    throw error;
  }
}

async function handleIncomingMessageSocket(botID, sender, messageData, event) {
  const [assignedChat] = await repoBots.getAssignedChatByField({
    "assigned_chats.bot_id": botID,
    "assigned_chats.phone_number": sender,
  });

  if (!assignedChat) return;

  if (
    Object.hasOwn(messageData, "metadata") &&
    messageData.metadata !== null &&
    messageData.metadata?.filesize
  ) {
    try {
      messageData.metadata.filesize = formatFileSize(
        messageData.metadata.filesize
      );
    } catch (error) {
      logger.error(`Error formatting file size: ${error.message}`);
      messageData.metadata.filesize = null;
    }
  }

  const room = createChatRoom(assignedChat.user_id, sender);
  const socket = getSocket();

  /* eslint-disable */
  switch (event) {
    case "new_message":
      socket.to(room).emit("message:new", messageData);
      break;
    case "message_edit":
      socket.to(room).emit("message:edited", {
        message_id: messageData.message_id,
        body: messageData.body,
      });
      break;
    case "message_revoked":
      socket.to(room).emit("message:revoked", {
        message_id: messageData.message_id,
      });
      break;
  }
  /* eslint-enable */
}

async function handleOutgoingMessageSocket(botID, recipient, messageData) {
  const [assignedChat] = await repoBots.getAssignedChatByField({
    "assigned_chats.bot_id": botID,
    "assigned_chats.phone_number": recipient,
  });

  if (!assignedChat) return;

  const room = createChatRoom(assignedChat.user_id, recipient);
  const socket = getSocket();

  socket.to(room).emit("message:confirmed", {
    data: messageData,
    status: "sent",
    timestamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  });
}

async function handleContactManagement(
  sender,
  networkId,
  direction,
  contactInfo,
  client
) {
  const {
    result: [botContactField],
  } = await socialContactsRepository.getByField({
    "social_contacts.contact_id": client,
    "social_contacts.network_id": networkId,
  });

  if (!botContactField) {
    await socialContactsRepository.save({
      "social_contacts.contact_id": client,
      "social_contacts.network_id": networkId,
    });
  }

  if (direction === "receive" && sender) {
    await handleSenderContact(sender, networkId, contactInfo);
  }
}

async function handleSenderContact(sender, networkId, contactInfo) {
  const { result: contactField } = await socialContactsRepository.getByField({
    "social_contacts.contact_id": sender,
    "social_contacts.network_id": networkId,
  });

  try {
    const phoneNumber = parsePhoneNumber(`+${sender}`);

    if (contactField.length > 0) {
      const [userContactField] = contactField;
      const existingMetadata = userContactField.metadata;

      const userProfile = {
        ...existingMetadata,
        general: {
          ...existingMetadata?.general,
          ...(!existingMetadata?.general?.name && {
            name: formatName(contactInfo.name || contactInfo.profile_name),
          }),
          ...(!existingMetadata?.general?.serialize && {
            serialize: contactInfo.serialize,
          }),
          ...(!existingMetadata?.general?.profile_desc && {
            profile_desc: contactInfo.about,
          }),
          formattedNumber: {
            ...existingMetadata?.general?.formattedNumber,
            ...(existingMetadata?.general?.formattedNumber?.country
              ? {}
              : { country: phoneNumber.country }),
            ...(existingMetadata?.general?.formattedNumber?.callingCode
              ? {}
              : { callingCode: phoneNumber.countryCallingCode }),
            ...(existingMetadata?.general?.formattedNumber?.nationalNumber
              ? {}
              : { nationalNumber: phoneNumber.nationalNumber }),
            ...(existingMetadata?.general?.formattedNumber?.uri
              ? {}
              : { uri: phoneNumber.getURI() }),
          },
        },
      };

      await socialContactsRepository.update(
        { "social_contacts.uuid_unique": userContactField.uuid_unique },
        {
          picture: contactInfo.profile_pic,
          metadata: JSON.stringify(userProfile),
        }
      );
    } else {
      const userProfile = {
        general: {
          name: formatName(contactInfo.name || contactInfo.profile_name),
          serialize: contactInfo.serialize,
          profile_desc: contactInfo.about,
          formattedNumber: {
            country: phoneNumber.country,
            callingCode: phoneNumber.countryCallingCode,
            nationalNumber: phoneNumber.nationalNumber,
            uri: phoneNumber.getURI(),
          },
        },
      };

      await socialContactsRepository.upsert("contact_id",
        {
          "social_contacts.contact_id": sender,
          "social_contacts.network_id": networkId,
          "social_contacts.picture": contactInfo.profile_pic,
          "social_contacts.metadata": JSON.stringify(userProfile),
        }
      );
    }
  } catch (phoneError) {
    logger.error(
      `Error processing phone number for contact ${sender}:`,
      phoneError
    );
  }
}

module.exports = { messageProcess };
