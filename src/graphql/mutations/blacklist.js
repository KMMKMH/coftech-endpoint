const {
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLBoolean,
} = require("graphql");
const { BlacklistType } = require("../types/blacklist");
const {
  createBlacklist,
  deleteBlacklist,
} = require("../resolvers/blacklist");
const { withPermission } = require("../../utils/routerPermissionsGQ");

const createBlacklistMutation = {
  type: BlacklistType,
  args: {
    botID: { type: new GraphQLNonNull(GraphQLID) },
    phone: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: withPermission(["ADMIN", "SUPERADMIN"], createBlacklist),
};

const deleteBlacklistMutation = {
  type: GraphQLBoolean,
  args: {
    botID: { type: new GraphQLNonNull(GraphQLID) },
    phone: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: withPermission(["ADMIN", "SUPERADMIN"], deleteBlacklist),
};

module.exports = {
  createBlacklist: createBlacklistMutation,
  deleteBlacklist: deleteBlacklistMutation,
};
