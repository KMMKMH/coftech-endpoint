const { BaseRepository } = require("./base");
const logger = require("../utils/logger");

class UrlRepository extends BaseRepository {
  constructor() {
    super("short_url");
  }

  async saveUrl(data, options = {}) {
    const sanitized = this._sanitizeData(data);
    logger.info(`Saving URL with data: ${JSON.stringify(sanitized)}`);

    try {
      const inserted = await super.save(sanitized, options);

      if (!inserted) {
        throw new Error("Failed to insert URL record");
      }

      logger.info(`Saved URL: ${JSON.stringify(inserted)}`);
      return inserted;
    } catch (error) {
      logger.error(`Error saving URL: ${error.message}`);
      throw new Error("Error saving URL");
    }
  }

  async updateUrl(where, data, options = {}) {
    const sanitized = this._sanitizeData(data);
    logger.info(
      `Updating URL where: ${JSON.stringify(where)}, data: ${JSON.stringify(
        sanitized
      )}`
    );

    try {
      const response = await super.update(where, sanitized, options);

      if (response === 0) {
        throw new Error("URL not found for update");
      }

      logger.info("Updated URL successfully.");
      return response;
    } catch (error) {
      logger.error(`Error updating URL: ${error.message}`);
      throw new Error("Error updating URL");
    }
  }

  _sanitizeData(data) {
    const protectedFields = ["id", "uuid_unique", "created_at", "updated_at"];
    const sanitized = { ...data };

    for (const field of protectedFields) {
      delete sanitized[field];
    }

    return sanitized;
  }
}

module.exports = {
  repoUrl: new UrlRepository(),
};
