const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString,
  GraphQLList,
  GraphQLID,
} = require("graphql");

const RaffleUserType = new GraphQLObjectType({
  name: "RaffleUserType",
  fields: {
    id: {
      type: GraphQLID,
      description: "Unique identifier for the Raffle User (UUID)",
    },
    phone: {
      type: GraphQLInt,
      description: "Phone number of the Raffle User",
    },
    isActive: {
      type: GraphQLBoolean,
      description: "Is the Raffle User active?",
      resolve: (root) => (root.is_active === 0 ? false : true),
    },
    createdAt: {
      type: GraphQLString,
      description: "Date and time the Raffle User was created",
      resolve: (root) => root.updated_at.toISOString(),
    },
    updateAt: {
      type: GraphQLString,
      description: "Date and time the Raffle User was updated",
      resolve: (root) => root.updated_at.toISOString(),
    },
  },
});

const RaffleUserPaginatedType = new GraphQLObjectType({
  name: "RaffleUserPaginatedType",
  fields: {
    items: { type: new GraphQLList(RaffleUserType) },
    totalPages: { type: GraphQLInt },
    currentPage: { type: GraphQLInt },
    totalUsers: { type: GraphQLInt },
  },
});

module.exports = { RaffleUserPaginatedType };
