const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "booking_reminders_status";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("name").notNullable();
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([
    {
      name: "pending",
    },
    {
      name: "confirmed",
    },
    {
      name: "cancelled",
    },
    {
      name: "rescheduled",
    },
    {
      name: "scheduled",
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
