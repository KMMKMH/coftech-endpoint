const fs = require("fs");
const { GraphQLSchema, GraphQLObjectType } = require("graphql");
const path = require("path");

const loadFields = (dir) => {
  const fields = {};
  fs.readdirSync(dir).forEach((file) => {
    if (file.endsWith(".js")) {
      const field = require(path.join(dir, file));
      Object.assign(fields, field);
    }
  });
  return fields;
};

const queries = loadFields(path.join(__dirname, "queries"));
const mutations = loadFields(path.join(__dirname, "mutations"));
const typesObj = loadFields(path.join(__dirname, "types"));

const types = Object.values(typesObj).filter(
  (type) => typeof type === "object" && typeof type.name === "string"
);

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "Query",
    fields: queries,
  }),
  mutation: new GraphQLObjectType({
    name: "Mutation",
    fields: mutations,
  }),
  types,
});

module.exports = schema;
