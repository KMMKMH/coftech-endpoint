const { 
  GraphQLNonNull, 
  GraphQLList, 
  GraphQLID, 
  GraphQLString 
} = require("graphql");
const { getAgendaReserves } = require("../resolvers/agenda");
const AgendaReserveType = require("../types/agenda");

const agendaReserves = {
  type: new GraphQLList(AgendaReserveType),
  args: {
    companyID: { type: new GraphQLNonNull(GraphQLID) },
    event_type_id: { type: GraphQLID },
    status_id: { type: GraphQLID },
    date: { type: GraphQLString },
  },
  resolve: getAgendaReserves,
};

module.exports = { agendaReserves };
