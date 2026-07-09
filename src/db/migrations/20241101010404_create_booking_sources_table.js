const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "booking_sources";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("key").notNullable();
    table.string("name").notNullable();
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([
    {
      key: "google_calendar",
      name: "Google Calendar",
    },
    {
      key: "agenda_pro",
      name: "Agenda Pro",
    },
    {
      key: "coftech_calendar",
      name: "Coftech Calendar",
    },
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
