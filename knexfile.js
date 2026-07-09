 
require("dotenv").config();

module.exports = {
  local_db: {
    client: "mysql2",
    connection: {
      user: process.env.LOCAL_DB_USERNAME,
      password: process.env.LOCAL_DB_PASSWORD,
      database: process.env.LOCAL_DB_DATABASE,
      host: process.env.LOCAL_DB_HOSTNAME,
      port: process.env.LOCAL_DB_PORT,
      ssl: {
        rejectUnauthorized: false,
      },
    },
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
  noco_db: {
    client: "mysql2",
    connection: {
      user: process.env.NOCO_DB_USERNAME,
      password: process.env.NOCO_DB_PASSWORD,
      database: process.env.NOCO_DB_DATABASE,
      host: process.env.NOCO_DB_HOSTNAME,
      port: process.env.NOCO_DB_PORT,
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
};
