const {
  GraphQLList,
  GraphQLString,
  GraphQLID,
  GraphQLInt,
  GraphQLInputObjectType,
} = require("graphql");
const { ExportChatType, ExportChatStatusEnum } = require("../types/exportChat");
const { exportChats } = require("../resolvers/exportChat");

const ExportChatFilters = new GraphQLInputObjectType({
  name: "ExportChatFilters",
  fields: {
    status: { type: ExportChatStatusEnum },
    botId: { type: GraphQLID },
    clientPhone: { type: GraphQLString },
    userId: { type: GraphQLID },
    fromDate: { type: GraphQLString },
    toDate: { type: GraphQLString },
  },
});

module.exports = {
  exportChatsQuery: {
    type: new GraphQLList(ExportChatType),
    args: {
      filters: { type: ExportChatFilters },
      orderBy: { type: GraphQLString, defaultValue: "created_at" },
      orderDirection: { type: GraphQLString, defaultValue: "DESC" },
      limit: { type: GraphQLInt, defaultValue: 50 },
    },
    resolve: exportChats,
  },
};
