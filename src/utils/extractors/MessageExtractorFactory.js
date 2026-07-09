const MetaMessageExtractor = require("./MetaMessageExtractor");
const WaWebMessageExtractor = require("./WaWebMessageExtractor");
const BaileysMessageExtractor = require("./BaileysMessageExtractor");

class MessageExtractorFactory {
  /**
   * Creates the appropriate extractor based on the message source
   * @param {Object} rawPayload - Raw message payload
   * @param {string} source - Message source ('meta', 'web-whatsapp', etc.)
   * @returns {MessageExtractor} Instancia del extractor apropiado
   */
  static createExtractor(rawPayload, source) {
    switch (source?.toLowerCase()) {
    case "meta":
      return new MetaMessageExtractor(rawPayload);
    case "web-whatsapp":
      return new WaWebMessageExtractor(rawPayload);
    case "baileys":
      return new BaileysMessageExtractor(rawPayload);
    default:
      throw new Error(`Unsupported message source: ${source}`);
    }
  }

  /**
   * Lista de fuentes soportadas
   * @returns {string[]} Array de fuentes soportadas
   */
  static getSupportedSources() {
    return ["meta", "web-whatsapp", "baileys"];
  }
}

module.exports = MessageExtractorFactory;
