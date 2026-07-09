const { BaseRepository } = require("./base");

/**
 * @class StorageRepository
 * @description Repository for managing CRUD operations on the 'storage_company' table.
 * Extends BaseRepository to inherit basic functionality.
 */
class StorageRepository extends BaseRepository {
  /**
   * Creates a StorageRepository instance.
   */
  constructor() {
    super("storage_company");
  }
}

/**
 * @class StorageLogsRepository
 * @description Repository for managing log records in the 'storage_logs' table.
 */
class StorageLogsRepository extends BaseRepository {
  /**
   * Creates a StorageLogsRepository instance.
   */
  constructor() {
    super("storage_logs");
  }
}

/**
 * @class StorageBucketsRepository
 * @description Repository for managing storage buckets in the 'storage_buckets' table.
 */
class StorageBucketsRepository extends BaseRepository {
  /**
   * Creates a StorageBucketsRepository instance.
   */
  constructor() {
    super("storage_buckets");
  }
}

module.exports = {
  repoStorage: new StorageRepository(),
  repoStorageLogs: new StorageLogsRepository(),
  repoStorageBuckets: new StorageBucketsRepository(),
};
