const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_lottery_configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("lottery_id").notNullable();
    table.string("key").notNullable();
    table.longtext("data");
    table.string("description");
    table.timestamps(true, true);

    table
      .foreign("lottery_id")
      .references("uuid_unique")
      .inTable("raffle_lottery");
    table.unique(["lottery_id", "key"]);
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
