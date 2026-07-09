const {
  GraphQLBoolean,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
} = require("graphql");

const extensionType = new GraphQLObjectType({
  name: "ExtensionType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique identifier for the Extension (UUID)",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of the Extension",
    },
    key: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Key of the Extension",
    },
    is_active: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Indicates if the Extension is active",
    },
    description: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Description of the Extension",
    },
  },
});

module.exports = extensionType;
