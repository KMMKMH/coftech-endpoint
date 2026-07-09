const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.string("uuid_unique").unique().notNullable();
    table.string("key").notNullable();
    table.longtext("data");
    table.longtext("extra1");
    table.longtext("extra2");
    table.longtext("extra3");
    table.string("description");
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([{ key: "AWS_BOT_BALANCER_INSTANCES", data: 2, description: "Number of bots per instance" }]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
