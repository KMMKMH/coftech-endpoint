const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_categories";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("name").unique().notNullable();
    table.string("parent_id").nullable();
    table.string("keywords", 1500).nullable();
    table.string("company_id").notNullable();
    table.timestamps(true, true);

    table.unique(["name", "company_id"]);
    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("parent_id").references("uuid_unique").inTable(tableName);
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
