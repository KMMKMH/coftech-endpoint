const { GraphQLString, GraphQLList, GraphQLObjectType } = require("graphql");

const operationMetadataType = new GraphQLObjectType({
  name: "OperationMetadata",
  fields: {
    operationName: {
      type: GraphQLString,
      description: "Name of the operation",
    },
    description: {
      type: GraphQLString,
      description: "Description of the operation",
    },
    operationType: {
      type: GraphQLString,
      description: "Type of the operation",
    },
    extension: {
      type: new GraphQLList(GraphQLString),
      description:
        "extension related with this operation, like screenshots, etc",
    },
  },
});

module.exports = operationMetadataType;
