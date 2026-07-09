const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_queue_chats";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("bot_id").notNullable();
    table.string("contact_id").notNullable();
    table.string("department_id").notNullable();
    table.string("session_id").nullable();
    table
      .enum("status", ["PENDING", "ASSIGNED", "IN_PROGRESS", "CLOSED", "TIMEOUT", "CANCELED"])
      .defaultTo("PENDING");
    table.timestamp("timeout_notified_at").nullable();
    table.timestamps(true, true);

    table.foreign("bot_id").references("uuid_unique").inTable("bots");
    table
      .foreign("contact_id")
      .references("uuid_unique")
      .inTable("social_contacts");
    table
      .foreign("department_id")
      .references("uuid_unique")
      .inTable("call_center_departments");
    table
      .foreign("session_id")
      .references("uuid_unique")
      .inTable("call_center_sessions_logs");
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
