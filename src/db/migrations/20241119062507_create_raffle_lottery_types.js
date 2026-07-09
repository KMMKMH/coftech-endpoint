const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_lottery_types";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("lottery_type").notNullable();
    table.text("description");
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert({
    lottery_type: "AUTO_JOIN_PER_POINTS",
    description:
      "Automatic registration when the user has the required points.",
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
