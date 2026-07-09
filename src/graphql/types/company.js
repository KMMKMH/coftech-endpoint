const {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} = require("graphql");


const CompanyType = new GraphQLObjectType({
  name: "CompanyType",
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "Unique identifier for the Company (UUID)",
    },
    name: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Name of the Company",
    },
    logo: {
      type: GraphQLString,
      description: "Logo in base64 of the Company",
    },
    is_active: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: "Indicates if the Company is active",
    },
    created_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp when the Company was created",
      resolve: (root) => root.created_at.toISOString(),
    },
    updated_at: {
      type: new GraphQLNonNull(GraphQLString),
      description: "Timestamp when the Company was last updated",
      resolve: (root) => root.updated_at.toISOString(),
    },
  },
});

module.exports = { CompanyType };
