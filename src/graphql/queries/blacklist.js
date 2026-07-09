const { GraphQLList, GraphQLString, GraphQLNonNull, GraphQLID } = require("graphql");
const { BlacklistType } = require("../types/blacklist");
const { getBlacklist } = require("../resolvers/blacklist");
const { withPermission } = require("../../utils/routerPermissionsGQ");

const blacklist = {
  type: new GraphQLList(BlacklistType),
  args: {
    companyID: { type: new GraphQLNonNull(GraphQLID) },
    botID: { type: GraphQLID },
    phone: { type: GraphQLString },
    type: { type: GraphQLString },
  },
  resolve: withPermission(["ADMIN", "SUPERADMIN"], getBlacklist),
};

module.exports = { blacklist };
