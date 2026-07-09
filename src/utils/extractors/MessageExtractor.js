class MessageExtractor {
  /**
   * @param {Object} rawPayload - El payload crudo recibido
   */
  constructor(rawPayload) {
    if (new.target === MessageExtractor) {
      throw new Error(
        "MessageExtractor is an abstract class and cannot be instantiated directly."
      );
    }

    this.rawPayload = rawPayload;
  }

  /**
   * Extracts the unique message ID
   * @abstract
   * @returns {string|null}
   */
  extractMessageId() {
    throw new Error("extractMessageId() must be implemented by subclass");
  }

  /**
   * Extracts the message body/content
   * @abstract
   * @returns {string}
   */
  extractBody() {
    throw new Error("extractBody() must be implemented by subclass");
  }

  /**
   * Extracts media file information
   * @abstract
   * @returns {Object|null}
   */
  extractMediaData() {
    throw new Error("extractMediaData() must be implemented by subclass");
  }

  /**
   * Extracts the sender identifier
   * @abstract
   * @returns {string|null}
   */
  extractSender() {
    throw new Error("extractSender() must be implemented by subclass");
  }

  /**
   * Extracts the message type
   * @abstract
   * @returns {string}
   */
  extractType() {
    throw new Error("extractType() must be implemented by subclass");
  }

  /**
   * Extracts quoted/replied message information
   * @abstract
   * @returns {Object|null}
   */
  extractQuotedMessage() {
    throw new Error("extractQuotedMessage() must be implemented by subclass");
  }

  /**
   * Extracts additional/extra message information
   * @abstract
   * @returns {Object}
   */
  extractExtraData() {
    throw new Error("extractExtraData() must be implemented by subclass");
  }

  /**
   * Extracts information for the contact sending the message
   * @abstract
   * @returns {Object}
   */
  extractContactInfo() {
    throw new Error("extractContactInfo() must be implemented by subclass");
  }

  /**
   * Extracts the message recipient (for sent messages)
   * @abstract
   * @returns {string|null}
   */
  extractRecipient() {
    throw new Error("extractRecipient() must be implemented by subclass");
  }

  /**
   * Extracts the message timestamp
   * @abstract
   * @returns {number|null}
   */
  extractTimestamp() {
    throw new Error("extractTimestamp() must be implemented by subclass");
  }

  /**
   * Checks whether the message is from a group
   * @abstract
   * @returns {boolean}
   */
  isGroupMessage() {
    throw new Error("isGroupMessage() must be implemented by subclass");
  }

  /**
   * Checks whether the message is a broadcast
   * @abstract
   * @returns {boolean}
   */
  isBroadcastMessage() {
    throw new Error("isBroadcastMessage() must be implemented by subclass");
  }

  /**
   * Determines the message direction (send/receive)
   * @abstract
   * @returns {string}
   */
  extractDirection() {
    throw new Error("extractDirection() must be implemented by subclass");
  }

  /**
   * Checks whether the message was edited
   * @abstract
   * @returns {boolean}
   */
  isEditedMessage() {
    throw new Error("isEditedMessage() must be implemented by subclass");
  }

  /**
   * Checks whether the message was revoked
   * @abstract
   * @returns {boolean}
   */
  isRevokedMessage() {
    throw new Error("isRevokedMessage() must be implemented by subclass");
  }

  /**
   * Extracts the message author (for special cases such as Meta AI)
   * @abstract
   * @returns {string|null}
   */
  extractAuthor() {
    throw new Error("extractAuthor() must be implemented by subclass");
  }

  /**
   * Extracts provider/webhook-specific metadata
   * @abstract
   * @returns {Object}
   */
  extractProviderMetadata() {
    throw new Error(
      "extractProviderMetadata() must be implemented by subclass"
    );
  }

  /**
   * Checks whether this is a Meta AI message or another special bot
   * @abstract
   * @returns {boolean}
   */
  isSpecialBotMessage() {
    throw new Error("isSpecialBotMessage() must be implemented by subclass");
  }
}

module.exports = MessageExtractor;
