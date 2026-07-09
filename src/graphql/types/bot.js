const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
} = require("graphql");

const {
  getBotsExtensions,
  getBotsContacts,
  getLastContacts,
} = require("../resolvers/bot");

const { ContactPaginatedType, lastContactType } = require("./social");
const extensionType = require("../types/extension");

const BotType = new GraphQLObjectType({
  name: "BotType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique identifier for the Bot (UUID)",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of the Bot",
    },
    planID: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Plan associated with the Bot",
    },
    phone: {
      type: GraphQLString,
      description: "Phone number of the Bot",
      resolve: (bot) => {
        return bot.phone && bot.phone.trim() !== "" ? bot.phone : null;
      },
    },
    types: {
      type: new GraphQLNonNull(GraphQLInt),
      description: "Type identifier for the Bot",
    },
    suspended: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Indicates if the Bot is suspended",
    },
    photo: {
      type: GraphQLString,
      description: "Photo in base64 of the Bot",
    },
    description: {
      type: GraphQLString,
      description: "Description of the Bot",
    },
    network: {
      type: GraphQLString,
      description: "Network associated with the Bot",
    },
    status: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Current status of the Bot",
    },
    companyID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique identifier for the company associated with the Bot",
    },
    created_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp when the Bot was created",
    },
    updated_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp when the Bot was last updated",
    },
    extensions: {
      type: new GraphQLList(extensionType),
      description: "List of extensions associated with the Bot",
      args: {
        id: { type: GraphQLID },
        is_active: { type: GraphQLBoolean },
      },
      resolve: getBotsExtensions,
    },
    contacts: {
      type: new GraphQLNonNull(ContactPaginatedType),
      description: "Paginated list of contacts associated with the Bot",
      args: {
        phone: {
          type: GraphQLString,
          description: "Phone number of the contact",
        },
        networkID: {
          type: new GraphQLNonNull(GraphQLString),
          description: "Network ID to filter contacts",
        },
        limit: { type: GraphQLInt, defaultValue: 10 },
        page: { type: GraphQLInt, defaultValue: 1 },
      },
      resolve: (parent, args, context) => {
        context.botID = parent.id;
        return getBotsContacts(parent, args, context);
      },
    },
    lastContacts: {
      type: new GraphQLList(lastContactType),
      description: "List of last contacts associated with the Bot",
      args: {
        limit: {
          type: GraphQLInt,
          defaultValue: 10,
          description: "Number of last contacts",
        },
        networkID: {
          type: new GraphQLNonNull(GraphQLString),
          description: "Network ID to filter contacts",
        },
        snProviderID: {
          type: GraphQLString,
          description: "Optional social network provider ID to filter contacts",
        },
      },
      resolve: async (parent, args, context) => {
        const { limit, networkID, snProviderID } = args;
        return await getLastContacts(
          parent,
          { limit, networkID, snProviderID },
          context
        );
      },
    },
  },
});

module.exports = { BotType };
