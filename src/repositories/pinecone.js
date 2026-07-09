const logger = require("../utils/logger");
const { BaseRepository } = require("./base");

class PineconeIndexFilesRepository extends BaseRepository {
  constructor() {
    super("pinecone_index_files");
  }
}

class PineconeDisabledFilesRepository extends BaseRepository {
  constructor() {
    super("pinecone_disabled_files");
  }

  async getByField(data, options = {}) {
    try {
      this._validateNotEmpty(data, "data");

      const { isRaw, query } = this._validateOptions(options);

      query
        .select(
          `${this.tableName}.*`,
          "filemanager_files.identificator as identificator",
          query.client.raw(
            `CONCAT(filemanager_files.name, filemanager_files.extension) as file_name`
          )
        )
        .leftJoin(
          "filemanager_files",
          `${this.tableName}.file_id`,
          "filemanager_files.uuid_unique"
        );

      isRaw ? query.whereRaw(data) : query.where(data);

      const res = await query;
      return res.length > 0 ? res : [];
    } catch (error) {
      logger.error(`Error getting disabled files: ${error.message}`);
      throw new Error("Error getting disabled files data");
    }
  }
}

class PineconeChunkLogsRepository extends BaseRepository {
  constructor() {
    super("pinecone_chunk_logs");
  }

  async countChunksByFileID(where, options = {}) {
    try {
      this._validateNotEmpty(where, "where");

      const { query } = this._validateOptions(options);

      const result = await query
        .where(where)
        .countDistinct("chunk_number as count")
        .first();

      return Number(result.count);
    } catch (error) {
      logger.error(`Error counting chunks by file ID: ${error.message}`);
      throw new Error("Error counting chunks by file ID");
    }
  }

  async isFileUploadComplete(fileID, expectedChunks, options = {}) {
    try {
      const count = await this.countChunksByFileID(
        { [`${this.tableName}.file_id`]: fileID },
        options
      );
      return count === expectedChunks;
    } catch (error) {
      logger.error(`Error checking upload completeness: ${error.message}`);
      throw new Error("Error checking file upload completeness");
    }
  }
}

module.exports = {
  repoPineconeIndexFiles: new PineconeIndexFilesRepository(),
  repoPineconeDisabledFiles: new PineconeDisabledFilesRepository(),
  repoPineconeChunkLogs: new PineconeChunkLogsRepository(),
};
