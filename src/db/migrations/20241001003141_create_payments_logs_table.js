const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "payments_logs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("payment_id").notNullable();
    table.string("phone").notNullable();
    table.string("status").notNullable();
    table.string("amount").notNullable();
    table.string("currency").notNullable().defaultTo("USD");
    table.string("provider").nullable().defaultTo(null);
    table.json("provider_response").nullable().defaultTo(null);
    table.string("provider_reference").nullable().defaultTo(null);
    table.json("metadata").nullable().defaultTo(null);
    table.timestamps(true, true);

    table.foreign("payment_id").references("uuid_unique").inTable("payments");
    table
      .foreign("provider")
      .references("uuid_unique")
      .inTable("payments_provider");
    table
      .foreign("status")
      .references("uuid_unique")
      .inTable("payments_status");
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
