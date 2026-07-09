const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "social_contacts";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("contact_id").notNullable();
    table.string("network_id").notNullable();
    table.string("company_id").notNullable();
    table.string("user_data");
    table.string("extra1");
    table.string("extra2");
    table.string("extra3");

    table.unique(["company_id", "contact_id"]);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table
      .foreign("network_id")
      .references("uuid_unique")
      .inTable("social_networks");
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
