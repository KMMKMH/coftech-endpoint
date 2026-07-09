require("dotenv").config();
const knex = require("knex");
const config = require("../../knexfile")["local_db"];
const db = knex(config);

db.raw("SELECT 1")
  .then(() => {
    console.log("Local DB connected");
  })
  .catch((e) => {
    console.log("Local DB not connected");
    console.error(e);
  });

module.exports = db;
