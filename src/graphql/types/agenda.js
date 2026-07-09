const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
} = require("graphql");

const AgendaReserveType = new GraphQLObjectType({
  name: "AgendaReserveType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique identifier for the Agenda Reserve (UUID)",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of the agenda reserve",
    },
    status_id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Status identifier for the agenda reserve",
    },
    event_type_id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Event type identifier for the agenda reserve",
    },
    date: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Date of the agenda reserve",
    },
    phone_numbers: {
      type: new GraphQLList(GraphQLString),
      description: "List of phone numbers associated with the agenda reserve",
    },
    companyID: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Company identifier associated with the agenda reserve",
    },
    public_notes: {
      type: GraphQLString,
      description: "Public notes for the agenda reserve",
    },
    private_notes: {
      type: GraphQLString,
      description: "Private notes for the agenda reserve",
    },
    created_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Creation timestamp of the agenda reserve",
    },
    updated_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Last update timestamp of the agenda reserve",
    },
  },
});

module.exports = AgendaReserveType;
