const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");
const { up, down } = require("../../utils/uuid_v4_trigger");

const tableName = "system_prompts_backup";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.integer("original_id").notNullable();
    table.string("uuid_unique").notNullable().unique();
    table.string("key", 100).notNullable();
    table.string("name", 255).notNullable();
    table.text("prompt_data").notNullable();
    table.string("parent_id").nullable();
    table.json("metadata").nullable();
    table.string("created_by").notNullable();
    table.timestamps(true, true);
    table.timestamp("backed_up_at").defaultTo(knex.fn.now());

    table.index(["original_id"], "idx_backup_original_id");
    table.index(
      ["original_id", "backed_up_at"],
      "idx_backup_original_backedup"
    );
    table.index(
      ["created_by", "backed_up_at"],
      "idx_backup_createdby_backedup"
    );
    table.index(["key", "created_by"], "idx_backup_key_createdby");
    table.index(
      ["backed_up_at", "created_by"],
      "idx_backup_backedup_createdby"
    );
    table.index(
      ["created_by", "created_at", "backed_up_at"],
      "idx_backup_user_dates"
    );
    table.index(["original_id", "created_at"], "idx_backup_original_created");
    table.index(["backed_up_at", "original_id"], "idx_backup_cleanup");

    table
      .foreign("original_id")
      .references("id")
      .inTable("system_prompts")
      .onDelete("CASCADE");
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
  await knex.raw(dropUpdatedAtTrigger(tableName));
  await knex.schema.dropTable(tableName);
};
