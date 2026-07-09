const axios = require("axios");
const logger = require("../../logger");

class MetaMediaService {
  constructor(accessToken, phoneNumberId) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.baseURL = "https://graph.facebook.com/v23.0";
  }

  /**
   * Downloads a media file using the media ID and returns it as base64
   * @param {string} mediaId - Media file ID
   * @returns {Promise<Object>} Information about the file downloaded into memory
   */
  async downloadMedia(mediaId) {
    try {
      const mediaUrl = await this.getMediaUrl(mediaId);
      const downloadedFile = await this.downloadFile(mediaUrl);

      return {
        success: true,
        base64: downloadedFile.base64,
        contentType: downloadedFile.contentType,
        extension: downloadedFile.extension,
        size: downloadedFile.size,
      };
    } catch (error) {
      logger.error("Error downloading media:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Gets the media download URL
   * @param {string} mediaId - Media file ID
   * @returns {Promise<string>} Download URL
   */
  async getMediaUrl(mediaId) {
    const url = `${this.baseURL}/${mediaId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.data.url) {
      throw new Error("Could not get the media URL");
    }

    return response.data.url;
  }

  /**
   * Downloads the file from the URL as a buffer and converts it to base64
   * @param {string} mediaUrl - File URL
   * @returns {Promise<Object>} Base64 file information
   */
  async downloadFile(mediaUrl) {
    const response = await axios.get(mediaUrl, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers["content-type"];
    const extension = this.getFileExtension(contentType);
    const base64 = buffer.toString("base64");

    return {
      base64,
      contentType,
      extension,
      size: buffer.length,
    };
  }

  /**
   * Gets the file extension from the content type
   * @param {string} contentType - Tipo de contenido
   * @returns {string} File extension
   */
  getFileExtension(contentType) {
    const extensions = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "video/mp4": ".mp4",
      "audio/mpeg": ".mp3",
      "audio/ogg": ".ogg",
      "application/pdf": ".pdf",
      "text/plain": ".txt",
    };

    return extensions[contentType] || "";
  }

  /**
   * Processes a message with media and returns the file in base64
   * @param {Object} mediaData - Media data extracted by MetaMessageExtractor
   * @returns {Promise<Object>} In-memory download result
   */
  async processMediaMessage(mediaData) {
    if (!mediaData || !mediaData.id) {
      throw new Error("Media data is required");
    }

    const result = await this.downloadMedia(mediaData.id);

    if (result.success) {
      logger.info(`Base64 file received (${result.size} bytes)`);
    } else {
      logger.error(`Error downloading file: ${result.error}`);
    }

    return result;
  }
}

module.exports = MetaMediaService;
