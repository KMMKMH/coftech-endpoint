const { BaseRepository } = require("./base");
const logger = require("../utils/logger");

class PromptsRepository extends BaseRepository {
  constructor() {
    super("prompts");
  }

  async getByField(data, options = {}) {
    try {
      this._validateNotEmpty(data, "data");
      const { query, isRaw } = this._validateOptions(options);

      query
        .select("prompts.*")
        .select("bots.name AS bot_name", "bots.photo AS bot_photo")
        .leftJoin("bots", "prompts.bot_id", "bots.uuid_unique");

      isRaw ? query.whereRaw(data) : query.where(data);

      const res = await query;
      return res.length > 0 ? res : [];
    } catch (error) {
      logger.error(
        `Error on "getByField" method of ${
          this.tableName
        } with data: ${JSON.stringify(data)}, error: ${JSON.stringify(error)}`
      );
      throw new Error(`Error getting ${this.tableName}`);
    }
  }

  async getPromptsWithImageUrl(companyID, imagePath, options = {}) {
    try {
      const { query } = this._validateOptions(options);

      query
        .select("prompts.*")
        .where("prompts.company_id", companyID)
        .where("prompts.data", "like", `%[[${imagePath}]]%`)
        .whereNotNull("prompts.metadata");

      const res = await query;
      return res.length > 0 ? res : [];
    } catch (error) {
      logger.error(
        `Error on getPromptsWithImageUrl for company ${companyID} and path ${imagePath}: ${error.message}`
      );
      throw new Error(`Error getting prompts with image URL`);
    }
  }
}

class PromptsBackupRepository extends BaseRepository {
  constructor() {
    super("prompts_backup");
  }
}

module.exports = {
  repoPrompts: new PromptsRepository(),
  repoPromptsBackup: new PromptsBackupRepository(),
};