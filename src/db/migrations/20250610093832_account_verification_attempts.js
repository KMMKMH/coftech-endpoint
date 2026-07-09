const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "account_verification_attempts";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("account_id").unique().notNullable();
    table.integer("verification_attempts").defaultTo(0);
    table.timestamp("blocked_until").nullable();
    table.timestamp("last_sent").nullable();
    table.integer("hourly_requests_count").defaultTo(0);
    table.timestamp("hourly_window_start").nullable();
    table.timestamps(false, false);

    table
      .foreign("account_id")
      .references("uuid_unique")
      .inTable("accounts")
      .onDelete("CASCADE");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTableIfExists(tableName);
};
