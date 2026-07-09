const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "payments_subscriptions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("customer_vault_id").notNullable();
    table.string("subscription_id").notNullable();
    table.string("payment_id").notNullable();
    table.float("plan_amount").notNullable();
    table.integer("plan_payments").notNullable().defaultTo(12);
    table.integer("month_frequency").defaultTo(1);
    table.integer("day_of_month").defaultTo(1);
    table.integer("day_frequency").defaultTo(1);
    table.timestamps(true, true);

    table
      .foreign("payment_id")
      .references("uuid_unique")
      .inTable("payments")
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
