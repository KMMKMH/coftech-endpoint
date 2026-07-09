const MessageExtractor = require("./MessageExtractor");
const logger = require("../logger");

class BaileysMessageExtractor extends MessageExtractor {
  constructor(rawPayload) {
    super(rawPayload);
    this.messageData = this.#getMessageData();
    this.meta_ia_numbers = ["13135550002"];
  }

  /**
   * Gets message data from the Baileys payload
   * @returns {Object|null} Message data or null if it does not exist
   */
  #getMessageData() {
    try {
      if (!this.rawPayload?.data) {
        return null;
      }

      return {
        message: this.rawPayload.data,
        clientData: this.rawPayload.client || this.rawPayload.bot_id,
        event: this.rawPayload.event || this.rawPayload.type,
        client: this.rawPayload.client || this.rawPayload.bot_id,
        network: this.rawPayload.network,
        botId: this.rawPayload.bot_id,
        extraData: this.rawPayload.data.extraData || {},
      };
    } catch (error) {
      logger.info(`Error extracting message data: ${error.message}`);
      return null;
    }
  }

  #sanitizeJid(jid) {
    if (!jid || typeof jid !== "string") return null;

    const withoutServer = jid.split("@")[0];

    const withoutDevice = withoutServer.split(":")[0];

    return withoutDevice || null;
  }

  #isGroupJid(jid) {
    if (!jid || typeof jid !== "string") return false;
    return jid.endsWith("@g.us");
  }

  #isBroadcastJid(jid) {
    if (!jid || typeof jid !== "string") return false;
    return jid.endsWith("@broadcast");
  }

  /**
   * Extracts the unique message ID
   * @returns {string|null}
   */
  extractMessageId() {
    const message = this.messageData?.message;
    return message?.id?.id || null;
  }

  /**
   * Extracts the message body/content
   * @returns {string}
   */
  extractBody() {
    const message = this.messageData?.message;

    if (message?.hasMedia && message?.extraData?.mediaData) {
      return message.extraData.mediaData || "";
    }

    if (message?.type === "location" && message?.location) {
      return `${message.location.latitude}, ${message.location.longitude}`;
    }

    if (!message) return "";

    return message.body || "";
  }

  /**
   * Extracts media file information
   * @returns {Object|null}
   */
  extractMediaData() {
    const message = this.messageData?.message;
    const extraData = this.messageData?.extraData;

    if (!message?.hasMedia || !extraData?.mediaData) {
      return null;
    }

    const metadata = extraData.mediaMetadata || {};

    return {
      mime_type: metadata.mimetype || null,
      filename: metadata.filename || null,
      type: message.type,
      size: metadata.filesize || null,
      data: extraData.mediaData,
      width: metadata.width || null,
      height: metadata.height || null,
      seconds: metadata.seconds || null,
    };
  }

  /**
   * Extracts the sender identifier
   * @returns {string|null}
   */
  extractSender() {
    const message = this.messageData?.message;
    if (!message?.id) return null;

    let sender = null;
    const isGroup = this.isGroupMessage();

    if (isGroup) {
      sender = message.id.fromMe ? this.messageData.client : message.author;
    } else {
      sender = message.id.fromMe ? this.messageData.client : message.from;
    }

    return this.#sanitizeJid(sender);
  }

  /**
   * Extracts the message recipient
   * @returns {string|null}
   */
  extractRecipient() {
    const message = this.messageData?.message;
    if (!message) return null;

    const id = message.id;
    if (!id) return null;

    let recipient = null;
    const messageMentions = message.mentionedIds || [];

    if (id.fromMe) {
      recipient =
        messageMentions.length > 0 && this.isGroupMessage()
          ? messageMentions[0]
          : message.from;
    } else {
      recipient = this.messageData.client;
    }

    return this.#sanitizeJid(recipient);
  }

  /**
   * Extracts the message type
   * @returns {string}
   */
  extractType() {
    const message = this.messageData?.message;
    if (!message) return "chat";

    return message.type;
  }

  /**
   * Extracts quoted/replied message information
   * @returns {Object|null}
   */
  extractQuotedMessage() {
    const message = this.messageData?.message;
    if (!message?.quotedMessage) return null;

    return {
      id: message.quotedMessage.stanzaId || null,
      from: this.#sanitizeJid(message.quotedMessage.participant),
      type: message.quotedMessage.type || null,
    };
  }

  /**
   * Extracts additional/extra message information
   * @returns {Object}
   */
  extractExtraData() {
    const extraData = {};
    const message = this.messageData?.message;
    const rawExtraData = this.messageData?.extraData || {};

    if (!message) return extraData;

    if (rawExtraData.caption) {
      extraData.caption = rawExtraData.caption;
    }

    if (rawExtraData.location) {
      const loc = rawExtraData.location;
      extraData.location = {
        latitude: loc.degreesLatitude || null,
        longitude: loc.degreesLongitude || null,
        name: loc.name || null,
        url: loc.url || null,
        description: loc.address || loc.comment || null,
        isLive: loc.isLive || false,
        accuracyInMeters: loc.accuracyInMeters || null,
        speedInMps: loc.speedInMps || null,
      };
    }

    if (rawExtraData.event) {
      const eventData = rawExtraData.event;

      extraData.event = {
        name: eventData.name || null,
        description: eventData.description || null,

        start: eventData.startTime || null,
        end: eventData.endTime || null,

        link: eventData.joinLink || null,

        location: eventData.location
          ? {
            name: eventData.location.name || null,
            address: eventData.location.address || null,
            degreesLatitude: eventData.location.degreesLatitude || null,
            degreesLongitude: eventData.location.degreesLongitude || null,
          }
          : null,

        isCanceled: eventData.isCanceled || false,
        extraGuestsAllowed: eventData.extraGuestsAllowed || false,
        isScheduleCall: eventData.isScheduleCall || false,
      };
    }

    if (rawExtraData.vcard) {
      const vcardData = rawExtraData.vcard;

      const vcardString =
        typeof vcardData === "string" ? vcardData : vcardData.vcard;

      const displayName =
        typeof vcardData === "object" ? vcardData.displayName : null;

      extraData.contact = this.#parseVCard(vcardString, displayName);
    }

    const quotedMessage = this.extractQuotedMessage();
    if (quotedMessage) {
      extraData.quoted = quotedMessage.id;
    }

    const mediaData = this.extractMediaData();
    if (mediaData) {
      extraData.media = mediaData;
    }

    if (this.isRevokedMessage()) {
      extraData.revoked = {
        is_revoked: true,
        timestamp: rawExtraData.revokedMessage?.timestamp || null,
        message_id: rawExtraData.revokedMessage?.message_id || null,
      };
    }

    if (this.isSpecialBotMessage()) {
      extraData.is_meta_ia = true;
    }

    if (message?.msg_edited) {
      extraData.edited = message?.originalMessageId || null;
    }

    if (this.#isGroupJid(message?.from)) {
      extraData.group_id = this.#sanitizeJid(message.from);
      extraData.fromMe = message?.id?.fromMe || false;

      const authorJid =
        message?.id?.participant ||
        message?.id?.participantAlt ||
        message?.participant;

      if (authorJid) {
        extraData.group_author = {
          lid: authorJid,
          sanitized: this.#sanitizeJid(authorJid),
        };
      }
    }

    if (message?.mentionedIds && Array.isArray(message.mentionedIds)) {
      extraData.mentions = message.mentionedIds
        .map((jid) => this.#sanitizeJid(jid))
        .filter(Boolean);
    }

    if (message?.type === "ptt" || message?.ptt) {
      extraData.is_voice_note = true;
      extraData.voice_duration = message?.seconds || 0;
    }

    if (message?.id?.addressingMode) {
      extraData.addressing_mode = message.id.addressingMode;
    }

    if (message?.messageCreatedVia) {
      extraData.message_created_via = message.messageCreatedVia;
    }

    if (message?.id?.fromMe !== undefined) {
      extraData.fromMe_root = message.id.fromMe;
    }

    if (message?.id?.server_id && message.id.server_id !== message.id.id) {
      extraData.message_id_alt = message.id.server_id;
    }

    return extraData;
  }

  /**
   * Extracts information for the contact sending the message
   * @returns {Object}
   */
  extractContactInfo() {
    const extraData = this.messageData?.extraData || {};
    const message = this.messageData?.message;

    if (this.isGroupMessage()) {
      return {};
    }

    const contactInfo = extraData.contactInfo || extraData.contact;

    return {
      name: contactInfo?.name || null,
      profile_name: contactInfo?.pushname || contactInfo?.name || null,
      wa_id: this.#sanitizeJid(message?.from),
      phone_number: this.#sanitizeJid(
        extraData.contactFormattedNumber || message?.from
      ),
      display_phone_number: null,
      profile_pic: extraData.profilePic || null,
      about: extraData.contactAbout || null,
      serialize: this.#sanitizeJid(message?.from),
    };
  }

  /**
   * Extracts the message timestamp
   * @returns {number|null}
   */
  extractTimestamp() {
    const message = this.messageData?.message;
    return message?.timestamp || null;
  }

  /**
   * Checks whether the message is from a group
   * @returns {boolean}
   */
  isGroupMessage() {
    const extraData = this.messageData?.extraData || {};
    const message = this.messageData?.message;

    if (extraData.isGroup !== undefined) {
      return extraData.isGroup;
    }

    return this.#isGroupJid(message?.from);
  }

  /**
   * Checks whether the message is a broadcast
   * @returns {boolean}
   */
  isBroadcastMessage() {
    const message = this.messageData?.message;
    return this.#isBroadcastJid(message?.from);
  }

  /**
   * Determines the message direction (send/receive)
   * @returns {string}
   */
  extractDirection() {
    const message = this.messageData?.message;
    if (!message?.id) return "receive";

    return message.id.fromMe ? "send" : "receive";
  }

  /**
   * Checks whether the message was edited
   * @returns {boolean}
   */
  isEditedMessage() {
    const message = this.messageData?.message;
    return message?.msg_edited || false;
  }

  /**
   * Checks whether the message was revoked
   * @returns {boolean}
   */
  isRevokedMessage() {
    const message = this.messageData?.message;
    return message?.type === "revoked";
  }

  /**
   * Extracts the message author
   * @returns {string|null}
   */
  extractAuthor() {
    const message = this.messageData?.message;
    if (!message) return null;

    if (message.id?.fromMe) {
      return this.#sanitizeJid(this.messageData.client);
    }

    if (message.author) {
      return this.#sanitizeJid(message.author);
    }

    if (message.from) {
      return this.#sanitizeJid(message.from);
    }

    return null;
  }

  /**
   * Extracts provider/webhook-specific metadata
   * @returns {Object}
   */
  extractProviderMetadata() {
    return {
      source: "baileys",
      network: this.messageData?.network || null,
      bot_id: this.messageData?.botId || null,
      event: this.messageData?.event || null,
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
   * @returns {boolean}
   */
  shouldProcessMessage() {
    return true;
  }

  #parseVCard(vcard, displayName = null) {
    if (!vcard) return null;

    try {
      const lines = vcard.split("\n");
      let fullName = displayName;
      let phoneInternational = null;
      let phoneType = null;
      let phoneWaid = null;

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith("FN:")) {
          fullName = trimmedLine.substring(3);
        }

        if (trimmedLine.startsWith("TEL")) {
          const telParts = trimmedLine.split(":");
          if (telParts.length >= 2) {
            phoneInternational = telParts[1];

            const typeMatch = trimmedLine.match(/type=([^;:]+)/i);
            if (typeMatch) {
              phoneType = typeMatch[1];
            }

            const waidMatch = trimmedLine.match(/waid=(\d+)/i);
            if (waidMatch) {
              phoneWaid = waidMatch[1];
            }
          }
        }
      }

      return {
        fullName: fullName || null,
        phoneInternational: phoneInternational || null,
        phoneType: phoneType || null,
        phoneWaid: phoneWaid || null,
      };
    } catch (error) {
      logger.error(`Error parsing vCard: ${error.message}`);
      return {
        fullName: displayName || null,
        phoneInternational: null,
        phoneType: null,
        phoneWaid: null,
      };
    }
  }
}

module.exports = BaileysMessageExtractor;
