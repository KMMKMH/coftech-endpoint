const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "booking_reminders";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("bot_id").notNullable();
    table.string("contact_id").notNullable();
    table.string("status").notNullable();
    table.string("source").notNullable();
    table.string("reminder_id").nullable();
    table.dateTime("start_datetime").notNullable();
    table.dateTime("end_datetime").notNullable();
    table.dateTime("confirmed_at").nullable().defaultTo(null);
    table.boolean("is_reminder_sent").nullable().defaultTo(false);
    table.boolean("is_auto_confirmed").nullable().defaultTo(false);
    table.string("company_id").notNullable();
    table.string("title").nullable().defaultTo(null);
    table.string("author_id").nullable().defaultTo(null);
    table.string("service_id").nullable().defaultTo(null);
    table.boolean("is_recurring").nullable().defaultTo(false);
    table.text("client_notes", "longtext").nullable().defaultTo(null);
    table.text("internal_notes", "longtext").nullable().defaultTo(null);
    table.json("metadata").nullable();
    table.timestamps(true, true);

    table
      .foreign("bot_id")
      .references("uuid_unique")
      .inTable("bots")
      .onDelete("CASCADE");
    table
      .foreign("contact_id")
      .references("uuid_unique")
      .inTable("social_contacts")
      .onDelete("RESTRICT");
    table
      .foreign("status")
      .references("uuid_unique")
      .inTable("booking_reminders_status")
      .onDelete("RESTRICT");

    table
      .foreign("source")
      .references("uuid_unique")
      .inTable("booking_sources")
      .onDelete("RESTRICT");

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company")
      .onDelete("CASCADE");
    table
      .foreign("author_id")
      .references("uuid_unique")
      .inTable("accounts")
      .onDelete("SET NULL");
    table
      .foreign("service_id")
      .references("uuid_unique")
      .inTable("booking_services")
      .onDelete("SET NULL");
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
