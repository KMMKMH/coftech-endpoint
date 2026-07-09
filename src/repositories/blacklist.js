const { BaseRepository } = require("./base");

/**
 * @class BlacklistRepository
 * @description Repository for managing the 'blacklist' table, extending BaseRepository functionality.
 * @extends BaseRepository
 */
class BlacklistRepository extends BaseRepository {
  
  /**
   * Creates a BlacklistRepository instance.
   */
  constructor() {
    super("blacklist");
  }
}

module.exports = {
  repoBlacklist: new BlacklistRepository(),
};
