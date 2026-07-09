const {
  GraphQLNonNull,
  GraphQLString,
  GraphQLID,
  GraphQLBoolean,
  GraphQLInputObjectType,
} = require("graphql");
const { ExportChatType } = require("../types/exportChat");
const {
  createExportChat,
  cancelExportChat,
} = require("../resolvers/exportChat");

const CreateExportChatInput = new GraphQLInputObjectType({
  name: "CreateExportChatInput",
  fields: {
    botId: { type: new GraphQLNonNull(GraphQLID) },
    clientPhone: { type: new GraphQLNonNull(GraphQLString) },
    isFullChat: { type: new GraphQLNonNull(GraphQLBoolean) },
    networkId: { type: new GraphQLNonNull(GraphQLString) },
    fromDate: { type: GraphQLString },
    toDate: { type: GraphQLString },
    includeMedia: { type: GraphQLBoolean, defaultValue: false },
  },
});

module.exports = {
  createExportChatMutation: {
    type: ExportChatType,
    args: {
      input: { type: new GraphQLNonNull(CreateExportChatInput) },
    },
    resolve: createExportChat,
  },

  cancelExportChatMutation: {
    type: ExportChatType,
    args: {
      uuidUnique: { type: new GraphQLNonNull(GraphQLString) },
    },
    resolve: cancelExportChat,
  },
};
