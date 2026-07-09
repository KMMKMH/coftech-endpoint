const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "filemanager_rag_status";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("file_id").unique().notNullable();
    table.boolean("is_completed").defaultTo(false).notNullable();
    table.datetime("date").notNullable();
    table.timestamps(false, false);

    table
      .foreign("file_id")
      .references("identificator")
      .inTable("filemanager_files")
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
