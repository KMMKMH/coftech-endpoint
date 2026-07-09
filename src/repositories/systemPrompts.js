const { BaseRepository } = require("./base");

class SystemPromptsRepository extends BaseRepository {
  constructor() {
    super("system_prompts");
  }
}

class SystemPromptsBackupRepository extends BaseRepository {
  constructor() {
    super("system_prompts_backup");
  }
}

module.exports = {
  repoSystemPrompts: new SystemPromptsRepository(),
  repoSystemPromptsBackup: new SystemPromptsBackupRepository(),
};
