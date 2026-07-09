const { up, down } = require('../../utils/uuid_v4_trigger');
const tableName = 'payments_queue';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("payment_id").notNullable();
    table.string("account_card_id").notNullable();
    table.enu("status", ["PENDING", "SUCCESS", "FAILED"]).notNullable();
    table.json("metadata").nullable().defaultTo(null);
    table.timestamps(true, true);

    table.foreign("payment_id").references("uuid_unique").inTable("payments");
    table.foreign("account_card_id").references("uuid_unique").inTable("accounts_cards");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
