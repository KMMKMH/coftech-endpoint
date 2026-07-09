const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "store_categories";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique();
    table.string("name").notNullable();
    table.string("parent_id").nullable();
    table.timestamps(true, true);

    table
      .foreign("parent_id")
      .references("uuid_unique")
      .inTable(tableName)
      .onDelete("CASCADE");
  });

  await knex.raw(up(tableName));

  await knex(tableName).insert([
    {
      name: "Bots",
    },
    {
      name: "Integrations",
    },
    {
      name: "Software",
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
