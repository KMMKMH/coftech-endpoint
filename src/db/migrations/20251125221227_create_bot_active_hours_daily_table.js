const { up, down } = require("../../utils/uuid_v4_trigger");
const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");
const tableName = "bot_active_hours_daily";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.increments("id").primary();
    table.uuid("uuid_unique").notNullable().unique();
    table.string("bot_id", 255).notNullable().index();
    table.date("date").notNullable().index();
    table.string("timezone", 100).notNullable().defaultTo("America/Panama");
    table.integer("messages_count").notNullable().defaultTo(0);
    table.integer("sessions_count").notNullable().defaultTo(0);
    table.integer("total_duration_seconds").notNullable().defaultTo(0);
    table.timestamp("first_message_at").nullable();
    table.timestamp("last_message_at").nullable();
    table.timestamps(true, true);

    table.unique(["bot_id", "date"]);
    table.index(["bot_id", "date"]);
    table.index(["date", "bot_id"]);
  });

  await knex.raw(up(tableName));
  await knex.raw(createUpdatedAtTrigger(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.raw(dropUpdatedAtTrigger(tableName))
  await knex.schema.dropTableIfExists(tableName);
};
