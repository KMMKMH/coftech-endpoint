const { GraphQLID, GraphQLList } = require("graphql");
const { CompanyType } = require("../types/company");
const { getCompany } = require("../resolvers/company");

const companies = {
  type: new GraphQLList(CompanyType),
  args: {
    id: { type: GraphQLID },
  },
  resolve: getCompany,
};

module.exports = { companies };
