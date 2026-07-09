const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
} = require("graphql");

const BlacklistType = new GraphQLObjectType({
  name: "BlacklistType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique identifier for the Blacklist entry (UUID)",
      resolve: (blacklist) => blacklist.uuid_unique,
    },
    company_id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Company ID associated with the blacklist entry",
    },
    bot_id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Bot ID associated with the blacklist entry",
    },
    phone: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Phone number being blacklisted",
    },
    type: {
      type: GraphQLString,
      description: "Type of blacklist entry (e.g., CLIENT, BOT)",
    },
    created_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp when the entry was created",
    },
    updated_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp when the entry was last updated",
    },
  },
});

module.exports = { BlacklistType };
