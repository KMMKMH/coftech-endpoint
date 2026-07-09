const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "google_scopes";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("key").notNullable().unique();
    table.string("name").notNullable();
    table.string("scope").notNullable();
    table.timestamps(true, true);
  });
  await knex.raw(up(tableName));

  await knex(tableName).insert([
    {
      key: "GOOGLE_CALENDAR",
      name: "Google Calendar",
      scope: "https://www.googleapis.com/auth/calendar",
    },
    {
      key: "GOOGLE_DRIVE",
      name: "Google Drive",
      scope: "https://www.googleapis.com/auth/drive",
    },
    {
      key: "GOOGLE_SPREADSHEETS",
      name: "Google Spreadsheets",
      scope: "https://www.googleapis.com/auth/spreadsheets",
    },
    {
      key: "GOOGLE_GMAIL",
      name: "Google Gmail",
      scope: "https://www.googleapis.com/auth/gmail.modify",
    },
    {
      key: "GOOGLE_DOCS",
      name: "Google Docs",
      scope: "https://www.googleapis.com/auth/documents",
    }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
