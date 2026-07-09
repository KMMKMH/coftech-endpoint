const MessageExtractor = require("./MessageExtractor");
const dayjs = require("dayjs");
const vCard = require("vcard-parser");
const { sendMessageToChannel } = require("../discordConnection");
const logger = require("../logger");

class WaWebMessageExtractor extends MessageExtractor {
  constructor(rawPayload) {
    super(rawPayload);
    this.messageData = this.#getMessageData();
    this.meta_ia_numbers = ["13135550002"];

    this.accessedPaths = new Set();

    this.expectedMissingProps = [
      "message.messageCreatedVia",
      "message.msg_edited",
      "message._data.revokeTimestamp",
      "message._data.protocolMessageKey",
      "message._data.quotedMsg",
      "message._data.quotedStanzaID",
      "message._data.caption",
      "message._data.isCaptionByUser",
      "message._data.author",
      "message._data.id.participant",
      "message._data.eventStartTime",
      "message._data.eventName",
      "message._data.eventDescription",
      "message._data.eventEndTime",
      "message._data.eventJoinLink",
      "message._data.eventLocation",
      "message.extraData.contact.*",
      "message.extraData.mediaData.*",
      "message.extraData.isBroadcast",
      "message.extraData.profilePic",
      "message.extraData.contactAbout",
      "message.extraData",
      "message.location",
      "message.vCards",
      "message.author",
      "message._data.latestEditMsgKey",
      "message._data.latestEditSenderTimestampMs",
      "message.latestEditMsgKey",
    ];

    this.proxyCache = new Map();

    this.proxiedMessageData = this.#createSafeProxy(this.messageData);
  }

  /**
   * @param {string} propertyPath - Property path
   * @param {Object} obj - Base object
   * @returns {boolean}
   */
  #checkPropertyPath(propertyPath, obj) {
    try {
      const parts = propertyPath.split(".");
      let current = obj;

      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          return false;
        }
      }

      return current !== undefined && current !== null;
    } catch (error) {
      logger.info(`Error checking properties ${error.message}`);
      return false;
    }
  }

  /**
   * Creates a proxy to safely handle undefined properties
   * @param {Object} obj - Object to protect
   * @param {string} path - Current object path
   * @returns {Proxy} Proxy that handles undefined properties
   */
  #createSafeProxy(obj, path = "") {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    const cacheKey = `${path}_${JSON.stringify(Object.keys(obj))}`;
    if (this.proxyCache.has(cacheKey)) {
      return this.proxyCache.get(cacheKey);
    }

    const self = this;

    const proxy = new Proxy(obj, {
      get: (target, prop) => {
        if (prop === "exists") {
          return (propPath) => {
            return this.#checkPropertyPath(propPath, obj);
          };
        }

        if (prop === "toJSON") {
          return function () {
            return { ...target };
          };
        }

        if (prop in target) {
          const newPath = path ? `${path}.${prop}` : prop.toString();
          if (typeof target[prop] === "object" && target[prop] !== null) {
            return self.#createSafeProxy(target[prop], newPath);
          }
          return target[prop];
        } else {
          const fullPath = path ? `${path}.${prop}` : prop.toString();

          if (
            !self.#isVerificationAccess() &&
            !self.accessedPaths.has(fullPath)
          ) {
            self.accessedPaths.add(fullPath);
            self.#handleUndefinedProperty(path, prop, obj);
          }

          return undefined;
        }
      },
    });

    this.proxyCache.set(cacheKey, proxy);
    return proxy;
  }

  /**
   * @returns {boolean}
   */
  #isVerificationAccess() {
    const caller = this.#getCaller();

    const verificationPatterns = [
      "#propertyExists",
      "#checkPropertyPath",
      "?.",
      "&&",
      "typeof",
      "hasOwnProperty",
    ];

    return verificationPatterns.some((pattern) => caller?.includes(pattern));
  }

  /**
   * @returns {string|null}
   */
  #getCaller() {
    try {
      const stack = new Error().stack;
      const stackLines = stack.split("\n");
      return stackLines[4] || null;
    } catch {
      return null;
    }
  }

  /**
   * Handles undefined properties and reports errors
   * @param {string} path - Object path
   * @param {string} prop - Undefined property
   * @param {Object} obj - Original object
   */
  #handleUndefinedProperty(path, prop, obj) {
    const fullPath = path ? `${path}.${prop}` : prop;

    if (
      this.expectedMissingProps.includes(fullPath) ||
      this.expectedMissingProps.some((expectedProp) =>
        expectedProp.endsWith(".*")
          ? fullPath.startsWith(expectedProp.replace(".*", ""))
          : fullPath === expectedProp || fullPath.endsWith(expectedProp)
      )
    ) {
      return;
    }

    const details = {
      property: fullPath,
      event: this.rawPayload?.event,
      bot_id: this.rawPayload?.bot_id,
    };
    const errorData = {
      title: `WhatsApp Web error${
        this.rawPayload?.bot_id ? ` - Bot ID: ${this.rawPayload.bot_id}` : ""
      }`,
      description: "**Undefined property in WaWebMessageExtractor**",
      details,
      object: JSON.stringify(obj, null, 2).substring(0, 990) + "\n...",
      timestamp: new Date().toISOString(),
    };

    this.#reportError(errorData);
  }

  /**
   * Reports errors to the monitoring system
   * @param {Object} errorData - Error data
   */
  #reportError(errorData) {
    const data = [
      {
        title: errorData.title,
        description: errorData.description,
        color: 0xef4444,
        fields: [
          {
            name: "Error details",
            value: `\`\`\`json\n${JSON.stringify(
              errorData.details,
              null,
              2
            )}\n\`\`\``,
          },
          {
            name: "Received object",
            value: `\`\`\`json\n${errorData.object}\n\`\`\``,
          },
          {
            name: "Date and time",
            value: errorData.timestamp,
          },
        ],
        footer: {
          text: "Error captured by Backend (WaWebMessageExtractor)",
        },
      },
    ];

    const channelID =
      process.env.ENVIRONMENT === "development" ||
      process.env.ENVIRONMENT === "test"
        ? process.env.DISCORD_PROCESSOR_TEST
        : process.env.DISCORD_PROCESSOR_PROD;

    sendMessageToChannel(channelID, { embeds: data });
  }

  /**
   * @param {string} propertyPath - Property path (example: "message._data.body")
   * @returns {boolean}
   */
  #propertyExists(propertyPath) {
    return this.#checkPropertyPath(propertyPath, this.proxiedMessageData);
  }

  /**
   * Gets message data from the WhatsApp Web payload
   * @returns {Object|null} Message data or null if it does not exist
   */
  #getMessageData() {
    try {
      return {
        message: this.rawPayload?.data,
        clientData: this.rawPayload?.data,
        event: this.rawPayload?.event,
        client: this.rawPayload?.client,
        network: this.rawPayload?.network,
        botId: this.rawPayload?.bot_id,
      };
    } catch (error) {
      logger.info(`Error extracting message data: ${error.message}`);
      return null;
    }
  }

  /**
   * @returns {string|null}
   */
  extractMessageId() {
    const message = this.proxiedMessageData?.message;

    if (this.isEditedMessage() && message?.latestEditMsgKey?.id) {
      return message.latestEditMsgKey.id;
    }

    return message?.id?.id || null;
  }

  /**
   * Extracts the message body/content
   * @returns {string}
   */
  extractBody() {
    const message = this.proxiedMessageData?.message;
    if (!message) return "";

    if (message.hasMedia && message.extraData?.mediaData?.data) {
      return message.extraData.mediaData.data;
    }

    if (message.type && !message.type.startsWith("event_")) {
      if (this.#propertyExists("message._data.body")) {
        return message._data.body;
      }
    }

    if (message.type === "location" && message.location) {
      return `${message.location.latitude}, ${message.location.longitude}`;
    }

    if (message.type?.startsWith("event_")) {
      return "event_created";
    }

    return "";
  }

  /**
   * Extracts media file information
   * @returns {Object|null}
   */
  extractMediaData() {
    const message = this.proxiedMessageData?.message;

    if (!message?.hasMedia || !message.extraData?.mediaData) {
      return null;
    }

    const mediaData = message.extraData.mediaData;

    return {
      mime_type: mediaData.mimetype || null,
      filename: mediaData.filename || null,
      type: message.type,
      size: mediaData.filesize || null,
      data: mediaData.data || null,
    };
  }

  /**
   * Extracts the sender identifier
   * @returns {string|null}
   */
  extractSender() {
    const message = this.proxiedMessageData?.message;
    if (!message) return null;

    let sender;

    if (this.isGroupMessage()) {
      if (this.#propertyExists("message._data.author")) {
        sender =
          typeof message._data.author === "string"
            ? message._data.author.split("@")[0]
            : message._data.author._serialized?.split("@")[0];
      } else if (this.#propertyExists("message._data.id.participant")) {
        sender = message._data.id.participant.split("@")[0];
      }
    } else {
      if (this.#propertyExists("message._data.author")) {
        sender =
          typeof message._data.author === "string"
            ? message._data.author.split("@")[0]
            : message._data.author._serialized?.split("@")[0];
      } else if (message.from) {
        sender = message.from.split("@")[0];
      }
    }

    return sender || null;
  }

  /**
   * Extracts the message recipient
   * @returns {string|null}
   */
  extractRecipient() {
    const message = this.proxiedMessageData?.message;
    if (!message) return null;

    let recipient;
    const messageMentions = message.mentionedIds || [];

    if (this.isGroupMessage() && messageMentions.length > 0) {
      recipient = messageMentions[0].split("@")[0];
    } else {
      recipient = message.to.split("@")[0];
    }

    return recipient;
  }

  /**
   * Extracts the message type
   * @returns {string}
   */
  extractType() {
    const message = this.proxiedMessageData?.message;

    if (
      this.#propertyExists("message._data.type") &&
      this.#propertyExists("message._data.revokeTimestamp") &&
      this.#propertyExists("message._data.protocolMessageKey") &&
      message.type === "revoked"
    ) {
      return "revoked";
    }

    return message?.type || "unknown";
  }

  /**
   * Extracts quoted/replied message information
   * @returns {Object|null}
   */
  extractQuotedMessage() {
    const message = this.proxiedMessageData?.message;

    if (
      this.#propertyExists("message._data.quotedMsg") &&
      this.#propertyExists("message._data.quotedStanzaID")
    ) {
      return {
        id: message._data.quotedStanzaID,
        from: null,
      };
    }

    return null;
  }

  /**
   * Extracts additional/extra message information
   * @returns {Object}
   */
  extractExtraData() {
    const message = this.proxiedMessageData?.message;
    const extraData = {};

    if (!message) return extraData;

    if (this.#propertyExists("message._data.caption")) {
      extraData.caption = message._data.caption;
    }

    if (message.type === "location" && message.location) {
      extraData.location = message.location;
    }

    if (
      message.type === "event_creation" &&
      this.#propertyExists("message._data.eventStartTime")
    ) {
      extraData.event = {
        name: message._data.eventName || null,
        description: message._data.eventDescription || null,
        start: message._data.eventStartTime,
        end: message._data.eventEndTime || null,
        link: message._data.eventJoinLink || null,
        location: message._data.eventLocation?.name || null,
      };
    }

    if (
      message.type === "vcard" &&
      message.vCards &&
      Array.isArray(message.vCards)
    ) {
      try {
        const vCardString = message.vCards[0];
        const vCardParsed = vCard.parse(vCardString);
        extraData.contact = {
          fullName: vCardParsed.fn?.[0]?.value || null,
          phoneInternational: vCardParsed.tel?.[0]?.value || null,
          phoneType: vCardParsed.tel?.[0]?.meta?.type?.[0] || null,
          phoneWaid: vCardParsed.tel?.[0]?.meta?.waid?.[0] || null,
        };
      } catch (vCardError) {
        logger.error(`Error parsing vCard: ${vCardError.message}`);
      }
    }

    if (
      (message.msg_edited && message.latestEditMsgKey) ||
      (this.isSpecialBotMessage() && message.latestEditMsgKey?.id)
    ) {
      extraData.edited = message.id?.id;
    }

    const quotedMessage = this.extractQuotedMessage();
    if (quotedMessage) {
      extraData.quoted = quotedMessage.id;
    }

    if (this.isRevokedMessage()) {
      extraData.revoked = {
        is_revoked: true,
        timestamp: dayjs(message._data.revokeTimestamp).format(
          "YYYY-MM-DD HH:mm:ss"
        ),
        message_id:
          message._data.latestEditMsgKey?.id ||
          message._data.protocolMessageKey.id,
      };
    }

    const mediaData = this.extractMediaData();
    if (mediaData) {
      extraData.media = mediaData;
    }

    if (this.isSpecialBotMessage()) {
      extraData.is_meta_ia = true;
    }

    if (this.isGroupMessage() && message.author) {
      extraData.group_author = {
        lid: message.author,
      };
    }

    if (this.isGroupMessage()) {
      const rawGroupId = message._data?.id?.remote || message.to;
      const groupId = rawGroupId.split("@")[0] || rawGroupId;

      extraData.group_id = groupId;
      extraData.fromMe = message._data?.id?.fromMe || false;
    }

    return extraData;
  }

  /**
   * Extracts information for the contact sending the message
   * @returns {Object}
   */
  extractContactInfo() {
    const message = this.proxiedMessageData?.message;
    const contact = message?.extraData?.contact;

    if (this.isGroupMessage()) {
      return {};
    }

    return {
      name: contact?.name || null,
      profile_name: contact?.pushname || null,
      wa_id: null,
      phone_number: null,
      display_phone_number: null,
      profile_pic: message?.extraData?.profilePic || null,
      about: message?.extraData?.contactAbout || null,
      serialize: contact?.id?._serialized || null,
    };
  }

  /**
   * Extracts the message timestamp
   * @returns {number|null}
   */
  extractTimestamp() {
    const message = this.proxiedMessageData?.message;
    const timestamp = message?.timestamp;
    return timestamp ? parseInt(timestamp) : null;
  }

  /**
   * Checks whether the message is from a group
   * @returns {boolean}
   */
  isGroupMessage() {
    const message = this.proxiedMessageData?.message;
    return message?.extraData?.isGroup || false;
  }

  /**
   * Checks whether the message is a broadcast
   * @returns {boolean}
   */
  isBroadcastMessage() {
    const message = this.proxiedMessageData?.message;
    return message?.extraData?.isBroadcast || false;
  }

  /**
   * Determines the message direction (send/receive)
   * @returns {string}
   */
  extractDirection() {
    const message = this.proxiedMessageData?.message;

    if (message?.messageCreatedVia) {
      const fromAuthor = this.#propertyExists("message._data.from")
        ? message._data.from.split("@")[0]
        : null;
      const client = this.proxiedMessageData?.client;

      if (
        fromAuthor !== client &&
        !this.isBroadcastMessage() &&
        !this.isGroupMessage()
      ) {
        return "receive";
      }

      if (
        message.type &&
        !message.type.startsWith("event_") &&
        this.#propertyExists("message._data.body") &&
        message._data.body === "pong"
      ) {
        return "receive";
      }

      return "send";
    }

    return "receive";
  }

  /**
   * Checks whether the message was edited
   * @returns {boolean}
   */
  isEditedMessage() {
    const message = this.proxiedMessageData?.message;
    return !!(
      message?.msg_edited ||
      (this.isSpecialBotMessage() && message?.latestEditMsgKey?.id)
    );
  }

  /**
   * Checks whether the message was revoked
   * @returns {boolean}
   */
  isRevokedMessage() {
    const message = this.proxiedMessageData?.message;
    return message?.type === "revoked" && !!message?.id;
  }

  /**
   * Extracts the message author
   * @returns {string|null}
   */
  extractAuthor() {
    const message = this.proxiedMessageData?.message;

    if (!message) return null;

    if (message.author) {
      return message.author?.split("@")[0];
    }

    if (this.#propertyExists("message._data.author")) {
      return message._data.author?.split("@")[0];
    }

    if (message.from) {
      return message.from.split("@")[0];
    }

    return null;
  }

  /**
   * Extracts provider/webhook-specific metadata
   * @returns {Object}
   */
  extractProviderMetadata() {
    return {
      source: "whatsapp_web",
      network: this.proxiedMessageData?.network || null,
      bot_id: this.proxiedMessageData?.botId || null,
      event: this.proxiedMessageData?.event || null,
    };
  }

  /**
   * Checks whether this is a Meta AI message or another special bot
   * @returns {boolean}
   */
  isSpecialBotMessage() {
    const sender = this.extractSender();
    return this.meta_ia_numbers.includes(sender);
  }

  /**
   * Public method to check whether the message should be processed
   * Replaces the logic that was in messageProcess
   * @returns {boolean}
   */
  shouldProcessMessage() {
    if (
      !this.#propertyExists("message.messageCreatedVia") ||
      !this.proxiedMessageData.message.messageCreatedVia
    ) {
      return true;
    }

    const fromAuthor = this.#propertyExists("message._data.from")
      ? this.proxiedMessageData.message._data.from.split("@")[0]
      : null;

    if (
      fromAuthor !== this.proxiedMessageData.client &&
      !this.isBroadcastMessage() &&
      !this.isGroupMessage()
    ) {
      return false;
    }

    if (
      this.#propertyExists("message.type") &&
      !this.proxiedMessageData.message.type.startsWith("event_")
    ) {
      if (
        this.#propertyExists("message._data.body") &&
        this.proxiedMessageData.message._data.body === "pong"
      ) {
        return false;
      }
    }

    return true;
  }
}

module.exports = WaWebMessageExtractor;
