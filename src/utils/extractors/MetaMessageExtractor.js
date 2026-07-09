const MessageExtractor = require("./MessageExtractor");
const logger = require("../logger");
const { mapMessageType } = require("../metaMessageTypeMap");
const axios = require("axios");
const repoCompany = require("../../repositories/company");

class MetaMessageExtractor extends MessageExtractor {
  constructor(rawPayload) {
    super(rawPayload);
    this.messageData = this.#getMessageData();
    this.downloadedMedia = null;
  }

  /**
   * Gets message data from the Meta payload
   * @returns {Object|null} Message data or null if it does not exist
   */
  #getMessageData() {
    try {
      const entry = this.rawPayload?.data?.entry?.[0];
      const change = entry?.changes?.[0];
      const message = change?.value?.messages?.[0];
      const contact = change?.value?.contacts?.[0];
      const metadata = change?.value?.metadata;

      return {
        message,
        contact,
        metadata,
        entry,
      };
    } catch (error) {
      logger.error(`Error extracting message data: ${error.message}`);
      return null;
    }
  }

  /**
   * Cleans the Meta ID by removing the "wamid." prefix
   * @param {string} id - Original Meta ID
   * @returns {string|null} Clean ID without the prefix
   */
  #cleanMetaId(id) {
    if (!id || typeof id !== "string") return null;

    return id.startsWith("wamid.") ? id.substring(6) : id;
  }

  /**
   * Extracts the unique message ID
   * @returns {string|null} The clean message ID (without the wamid. prefix)
   */
  extractMessageId() {
    const rawId = this.messageData?.message?.id || null;

    return this.#cleanMetaId(rawId);
  }

  /**
   * Extracts the message body/content
   * @returns {string} The message content
   */
  async extractBody() {
    const message = this.messageData?.message;

    if (!message) return "";

    /* eslint-disable */
    switch (message.type) {
      case "text":
      case "chat":
        return message.text?.body || "";

      case "location":
        const latitude = message.location?.latitude;
        const longitude = message.location?.longitude;
        return latitude && longitude ? `${latitude}, ${longitude}` : "";

      case "image":
      case "video":
      case "audio":
      case "document":
      case "sticker":
        if (!this.downloadedMedia) {
          this.downloadedMedia = await this.#getMediaInfo(message);
        }
        return this.downloadedMedia.base64;

      case "contacts":
        return this.#getContactsInfo(message);

      default:
        return "";
    }
    /* eslint-enable */
  }

  /**
   * Extracts media file information
   * @returns {Object|null} The media file information
   */
  async extractMediaData() {
    const message = this.messageData?.message;

    if (!message) {
      return null;
    }

    const mediaTypes = ["image", "video", "audio", "document", "sticker"];
    const messageType = message.type;

    if (!mediaTypes.includes(messageType)) {
      return null;
    }

    const mediaData = message[messageType];

    if (!mediaData) {
      return null;
    }

    if (!this.downloadedMedia) {
      this.downloadedMedia = await this.#getMediaInfo(message);
    }

    return {
      id: mediaData.id,
      mimetype: mediaData.mime_type,
      sha256: mediaData.sha256,
      caption: mediaData.caption || null,
      filename: mediaData.filename || `${messageType}_${Date.now()}`,
      voice: mediaData.voice || false,
      animated: mediaData.animated || false,
      type: messageType,
      filesize: this.downloadedMedia.filesize,
    };
  }

  /**
   * Extracts the sender identifier
   * @returns {string|null} The sender number without @c.us
   */
  extractSender() {
    const message = this.messageData?.message;
    if (!message) return null;

    if (this.rawPayload?.data?.messageCreatedVia) {
      return message.from || this.messageData?.metadata?.display_phone_number;
    }

    return message.from ?? null;
  }

  /**
   * Extracts the message recipient
   * @returns {string|null}
   */
  extractRecipient() {
    const message = this.messageData?.message;

    if (this.rawPayload?.data?.messageCreatedVia && message?.to) {
      return message.to;
    }

    return this.messageData?.metadata?.display_phone_number || null;
  }

  /**
   * Extracts the message type
   * @returns {string} The message type
   */
  extractType() {
    return mapMessageType(this.messageData?.message?.type);
  }

  /**
   * Extracts quoted/replied message information
   * @returns {Object|null} Quoted message information
   */
  extractQuotedMessage() {
    const message = this.messageData?.message;

    if (message?.context) {
      return {
        id: this.#cleanMetaId(message.context.id),
        from: message.context.from || null,
      };
    }

    return null;
  }

  /**
   * Extracts additional/extra message information
   * @returns {Object} Object with extra information
   */
  async extractExtraData() {
    const message = this.messageData?.message;
    let extraData = {};

    if (!message) return extraData;

    if (message.type === "location" && message.location) {
      extraData.location = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        name: message.location.name || null,
        address: message.location.address || null,
      };
    }

    if (message.type === "contacts" && message.contacts) {
      extraData.contacts = message.contacts.map((contact) => ({
        name: {
          first_name: contact.name?.first_name || null,
          last_name: contact.name?.last_name || null,
          formatted_name: contact.name?.formatted_name || null,
        },
        phones:
          contact.phones?.map((phone) => ({
            phone: phone.phone,
            wa_id: phone.wa_id,
            type: phone.type,
          })) || [],
      }));
    }

    const mediaData = await this.extractMediaData();
    if (mediaData) {
      extraData = { ...extraData, ...mediaData };
    }

    if (message.timestamp) {
      extraData.timestamp = this.extractTimestamp();
    }

    return extraData;
  }

  /**
   * Extracts information for the contact sending the message
   * @returns {Object} Contact information
   */
  extractContactInfo() {
    const contact = this.messageData?.contact;
    const message = this.messageData?.message;

    const contactInfo = {
      name: null,
      profile_name: null,
      wa_id: null,
      phone_number: null,
      display_phone_number: null,
    };

    if (contact) {
      contactInfo.name = contact.profile?.name || null;
      contactInfo.wa_id = contact.wa_id || null;
    }

    if (message) {
      contactInfo.phone_number = message.from || null;
    }

    return contactInfo;
  }

  /**
   * Gets the message timestamp
   * @returns {number|null} Message Unix timestamp
   */
  extractTimestamp() {
    const timestamp = this.messageData?.message?.timestamp;
    return timestamp ? parseInt(timestamp) : null;
  }

  /**
   * Checks whether the message is from a group
   * @returns {boolean} True if it is a group message
   */
  isGroupMessage() {
    return false;
  }

  /**
   * Checks whether the message is a broadcast
   * @returns {boolean} True if the message is a broadcast
   */
  isBroadcastMessage() {
    return false;
  }

  /**
   * Determines the message direction (always receive for Meta webhooks)
   * @returns {string}
   */
  extractDirection() {
    if (this.rawPayload?.data?.messageCreatedVia) {
      return "send";
    }

    return "receive";
  }

  /**
   * Checks whether the message was edited
   * @returns {boolean}
   */
  isEditedMessage() {
    return false;
  }

  /**
   * Checks whether the message was revoked
   * @returns {boolean}
   */
  isRevokedMessage() {
    return false;
  }

  /**
   * Extracts the message author
   * @returns {string|null}
   */
  extractAuthor() {
    if (this.rawPayload?.data?.messageCreatedVia) {
      return this.messageData?.metadata?.display_phone_number || null;
    }

    return this.messageData?.message?.from || null;
  }

  /**
   * Extracts Meta webhook-specific metadata
   * @returns {Object}
   */
  extractProviderMetadata() {
    return {
      messaging_product:
        this.messageData?.change?.value?.messaging_product || null,
      bot_phone_number_id: this.messageData?.metadata?.phone_number_id || null,
      display_phone_number:
        this.messageData?.metadata?.display_phone_number || null,
      entry_id: this.messageData?.entry?.id || null,
      source: "meta",
    };
  }

  /**
   * Checks whether this is a Meta AI message or another special bot
   * @returns {boolean}
   */
  isSpecialBotMessage() {
    return false;
  }

  /**
   * Downloads media from the Meta API using the mediaId
   * @param {string} mediaId - Meta media ID
   * @param {Object} configs - Configuration with bot_id
   * @returns {Promise<base64>} Base64 file data
   */
  async downloadMedia(mediaId) {
    try {
      const bot_id = this.rawPayload.bot_id;

      const [configTokenField] = await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": bot_id,
        "configs_templates.owner_type": "provider",
        "configs_templates.key": "WHATSAPP_SYSTEM_ACCESS_TOKEN",
      });

      if (!configTokenField.data || configTokenField.data === "") {
        logger.error("Missing WhatsApp System Access Token");
        return {
          base64: "",
          filesize: 0,
        };
      }

      const [configNumberIDField] = await repoCompany.getCompanyConfigByField({
        "company_configs.bot_id": bot_id,
        "configs_templates.owner_type": "provider",
        "configs_templates.key": "WHATSAPP_PHONE_NUMBER_ID",
      });

      if (!configNumberIDField.data || configNumberIDField.data === "") {
        logger.error("Missing WhatsApp Phone Number ID");
        return {
          base64: "",
          filesize: 0,
        };
      }

      const mediaInfoUrl = `https://graph.facebook.com/v22.0/${mediaId}`;
      const mediaInfoResponse = await axios.get(mediaInfoUrl, {
        headers: {
          Authorization: `Bearer ${configTokenField.data}`,
        },
      });

      const mediaUrl = mediaInfoResponse.data.url;

      if (!mediaUrl) {
        throw new Error("Media URL not found in response");
      }

      const mediaResponse = await axios.get(mediaUrl, {
        responseType: "arraybuffer",
        headers: {
          Authorization: `Bearer ${configTokenField.data}`,
        },
      });

      const base64Data = Buffer.from(mediaResponse.data).toString("base64");
      const filesize = Buffer.byteLength(mediaResponse.data);

      return {
        base64: base64Data,
        filesize: filesize,
      };
    } catch (error) {
      logger.error("Error downloading meta media:", {
        message: error.message,
      });
      return {
        base64: "",
        filesize: 0,
      };
    }
  }

  /**
   * Gets media file information as a string
   * @param {Object} message - The message object
   * @returns {string} File information
   */
  async #getMediaInfo(message) {
    const mediaType = message.type;
    const mediaData = message[mediaType];

    if (!mediaData) {
      return {
        base64: "",
        filesize: 0,
      };
    }

    const mediaResult = await this.downloadMedia(mediaData.id);

    return {
      base64: mediaResult.base64,
      filesize: mediaResult.filesize,
    };
  }

  /**
   * Gets contact information as a string
   * @param {Object} message - The message object
   * @returns {string} Contact information
   */
  #getContactsInfo(message) {
    if (!message.contacts.length) {
      return "[Contact]";
    }

    const contactNames = message.contacts.map(
      (contact) =>
        contact.name?.formatted_name ||
        contact.name?.first_name ||
        "Unknown Contact"
    );

    return `[Contact: ${contactNames.join(", ")}]`;
  }

  /**
   * Gets the full webhook metadata (original method preserved)
   * @returns {Object} Metadata del webhook
   */
  extractWebhookMetadata() {
    return this.extractProviderMetadata();
  }
}

module.exports = MetaMessageExtractor;
