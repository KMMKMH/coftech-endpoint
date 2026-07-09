const { GraphQLString, GraphQLList } = require("graphql");
const { BotType } = require("../types/bot");
const { getBots } = require("../resolvers/bot");

const bots = {
  type: new GraphQLList(BotType),
  args: {
    phone: { type: GraphQLString },
  },
  resolve: getBots,
};

module.exports = { bots };
