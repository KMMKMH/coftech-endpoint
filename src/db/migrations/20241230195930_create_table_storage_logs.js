const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "storage_logs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table
      .enum("operation_type", [
        "upload",
        "delete",
        "update",
        "move",
        "copy",
        "create",
      ])
      .notNullable();
    table.string("file_name").notNullable();
    table.bigInteger("file_size").notNullable();
    table.bigInteger("change_in_quota").defaultTo(0);
    table.timestamp("timestamp").defaultTo(knex.fn.now());
    table.json("action_details").defaultTo(null);
    table.string("account_id").notNullable().unique();
    table.enum("status", ["success", "failed"]).notNullable();
    table.enum("source", ["filemanager", "desk"]).notNullable();
    table.enum("resource_type", ["file", "folder"]).notNullable();
    table.timestamps(true, true);

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company")
      .onDelete("CASCADE");

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
  return knex.schema.dropTable(tableName);
};
