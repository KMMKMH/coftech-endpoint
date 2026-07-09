const { GraphQLList } = require("graphql");
const OperationMetadataType = require("../types/operationMetadata");
const { getOperationsMetadata } = require("../resolvers/operationMetadata");

const operationsMetadata = {
  type: new GraphQLList(OperationMetadataType),
  resolve: getOperationsMetadata,
};

module.exports = { operationsMetadata };
