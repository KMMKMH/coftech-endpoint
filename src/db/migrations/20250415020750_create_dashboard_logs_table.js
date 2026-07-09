const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "dashboard_logs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("action_type").nullable();
    table.string("resource_type").notNullable();
    table.string("name").nullable();
    table
      .enu("status", ["success", "failure"])
      .notNullable()
      .defaultTo("success");
    table.string("user_id").nullable();
    table.string("company_id").nullable();
    table.json("metadata").nullable();
    table.timestamps(true, true);

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company")
      .onDelete("CASCADE");
    table
      .foreign("user_id")
      .references("uuid_unique")
      .inTable("accounts")
      .onDelete("SET NULL");

    table.index(["company_id"]);
    table.index(["name"]);
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
