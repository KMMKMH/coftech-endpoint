require("dotenv").config();
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const schema = require("./graphql/index");
const repoAccounts = require("./repositories/accounts");

const router = express.Router();

const serverApollo = new ApolloServer({
  schema,
  introspection: true,
  apollo: true,
  playground: true,
  formatError: (error) => {
    return {
      message: error.message,
      locations: error.locations,
      path: error.path,
      extensions: error.extensions,
    };
  },
});

const corsOptions = {
  origin: "*",
  methods: "GET,POST,OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

(async () => {
  await serverApollo.start();

  router.use(
    "/",
    cors(corsOptions),
    express.json(),
    expressMiddleware(serverApollo, {
      context: async ({ req }) => {
        const token = req.headers.authorization;
        if (!token) {
          throw new Error("Authorization token is missing");
        }

        const dataToken = jwt.verify(token, process.env.JWT_SECRET);  
        req.unique_token = dataToken;

        const [accountField] = await repoAccounts.getAccountByField({
          "accounts.uuid_unique": req.unique_token?.user,
        });

        if (accountField) {
          const { company_id: companyID, role_key: rolKey } = accountField;
          return { user: req.unique_token?.user, companyID, rolKey };
        }
      },
    })
  );
})();

module.exports = router;
