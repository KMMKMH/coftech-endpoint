require("dotenv").config();
let db = {};

 
if (process.env.ENVIRONMENT !== "development") {
  const knex = require("knex");
  const config = require("../../knexfile")["noco_db"];
  db = knex(config);

  db.raw("SELECT 1")
    .then(() => {
      console.log("Local Noco DB connected");
    })
    .catch((e) => {
      console.log("Local Noco DB not connected");
      console.error(e);
    });
}

module.exports = db;
