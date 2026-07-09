const { getRaffleUser } = require("../resolvers/raffle");
const { RaffleUserPaginatedType } = require("../types/raffle");
const { GraphQLString, GraphQLInt, GraphQLNonNull } = require("graphql");

const raffleUser = {
  type: new GraphQLNonNull(RaffleUserPaginatedType),
  args: {
    phone: { type: GraphQLString },
    limit: { type: GraphQLInt, defaultValue: 10 },
    page: { type: GraphQLInt, defaultValue: 1 },
  },
  resolve: getRaffleUser,
};

module.exports = { raffleUser };
