const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "aws_instances_bots";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.string("uuid_unique").unique().notNullable();
    table.string("instance_id").notNullable();
    table.string("bot_id").notNullable();
    table.timestamps(true, true);

    table.foreign("instance_id").references("uuid_unique").inTable("aws_instances");
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
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
