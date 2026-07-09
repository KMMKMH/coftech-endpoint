const { BaseRepository } = require("./base");

class PlansRepository extends BaseRepository {
  constructor() {
    super("plans");
  }
}

class PlansExtensionsRepository extends BaseRepository {
  constructor() {
    super("plans_extensions");
  }
}

module.exports = {
  repoPlans: new PlansRepository(),
  repoPlansExtensions: new PlansExtensionsRepository(),
};
