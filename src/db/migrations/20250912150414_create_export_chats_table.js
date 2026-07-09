const {
  up: createUuidTrigger,
  down: dropUuidTrigger,
} = require("../../utils/uuid_v4_trigger");
const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");

const tableName = "export_chats";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  return knex.schema
    .createTable(tableName, (table) => {
      table.bigIncrements("id").unsigned().primary();
      table.specificType("uuid_unique", "CHAR(36)").notNullable().unique();
      table.specificType("user_id", "VARCHAR(36)").notNullable();
      table.specificType("bot_id", "VARCHAR(36)").notNullable();
      table.specificType("client_id", "VARCHAR(36)").notNullable();
      table.specificType("bot_phone", "VARCHAR(20)").notNullable();
      table.specificType("client_phone", "VARCHAR(20)").notNullable();
      table.specificType("social_network_id", "VARCHAR(36)").notNullable();
      table.specificType("sn_provider_id", "VARCHAR(36)").notNullable();

      table
        .enum("status", [
          "QUEUE",
          "PROCESSING",
          "COMPLETE",
          "FAILED",
          "CANCELLED",
        ])
        .notNullable()
        .defaultTo("QUEUE");
      table.dateTime("from_date").nullable();
      table.dateTime("to_date").nullable();
      table.boolean("include_media").notNullable().defaultTo(false);
      table.boolean("is_full_chat").notNullable().defaultTo(false);
      table.text("presigned_url").nullable();
      table.bigInteger("file_size").unsigned().nullable();
      table.integer("total_messages").unsigned().nullable();
      table.text("error_message").nullable();
      table.timestamp("processed_at").nullable();
      table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

      table
        .foreign("user_id")
        .references("uuid_unique")
        .inTable("accounts")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table
        .foreign("bot_id")
        .references("uuid_unique")
        .inTable("bots")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table
        .foreign("client_id")
        .references("uuid_unique")
        .inTable("social_contacts")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");

      table
        .foreign("social_network_id")
        .references("uuid_unique")
        .inTable("social_networks")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");
      table
        .foreign("sn_provider_id")
        .references("uuid_unique")
        .inTable("social_networks_providers")
        .onDelete("CASCADE")
        .onUpdate("CASCADE");

      table.index(["user_id", "status"], "idx_export_chats_user_status");
      table.index(["bot_id", "client_id"], "idx_export_chats_bot_client");
      table.index(
        ["bot_phone", "client_phone"],
        "idx_export_chats_bot_client_phones"
      );
      table.index(["client_phone"], "idx_export_chats_client_phone");
      table.index(["created_at"], "idx_export_chats_created_at");
      table.index(["status"], "idx_export_chats_status");
      table.index(["social_network_id"], "idx_export_chats_social_network");
      table.index(["sn_provider_id"], "idx_export_chats_sn_provider");
    })
    .then(() =>
      knex.raw(`
        ALTER TABLE ${tableName}
        ADD CONSTRAINT chk_export_chats_date_range CHECK (from_date < to_date),
        ADD CONSTRAINT chk_export_chats_file_size CHECK (file_size IS NULL OR file_size > 0),
        ADD CONSTRAINT chk_export_chats_total_messages CHECK (total_messages IS NULL OR total_messages >= 0)
      `)
    )
    .then(() => knex.raw(createUuidTrigger(tableName)))
    .then(() => knex.raw(createUpdatedAtTrigger(tableName)));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  return knex
    .raw(dropUuidTrigger(tableName))
    .then(() => knex.raw(dropUpdatedAtTrigger(tableName)))
    .then(() => knex.schema.dropTableIfExists(tableName));
};
