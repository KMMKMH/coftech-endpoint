const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "accounts_cards";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("email").nullable().defaultTo(null);
    table.string("customer_vault_id").notNullable();
    table.string("card_id").notNullable();
    table.string("whatsapp").notNullable();
    table.string("source").notNullable().defaultTo("nmi");
    table.timestamps(true, true);
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
