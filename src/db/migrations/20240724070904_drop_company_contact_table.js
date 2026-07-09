const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "company_contact";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("key").notNullable();
    table.longtext("data");
    table.string("description");
    table.boolean("internal").notNullable().defaultTo(false);
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.unique(["company_id", "key"]);
  });

  await knex.raw(up(tableName));
};
