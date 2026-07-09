const { up, down } = require("../../utils/uuid_v4_trigger");
const {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
} = require("../../utils/updatedAtTrigger");
const tableName = "system_prompts";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("key", 100).notNullable();
    table.string("name", 255).notNullable();
    table.text("prompt_data").notNullable();
    table.string("parent_id").nullable();
    table.json("metadata").nullable();
    table.string("created_by").notNullable();
    table.timestamps(true, true);

    table
      .foreign("parent_id")
      .references("uuid_unique")
      .inTable("system_prompts")
      .onDelete("SET NULL");

    table
      .foreign("created_by")
      .references("uuid_unique")
      .inTable("accounts")
      .onDelete("CASCADE");

    table.unique(["parent_id", "key"]);
    table.index(["parent_id", "created_by"], "idx_parent_createdby");
    table.index(["created_by", "created_at"], "idx_createdby_createdat");
    table.index(["created_at"], "idx_system_prompts_created_at");
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
