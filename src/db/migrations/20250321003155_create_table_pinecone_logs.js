const tableName = "pinecone_chunk_logs";
const { up, down } = require("../../utils/uuid_v4_trigger");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("file_id").notNullable();
    table.string("index_file_id").notNullable();
    table.integer("chunk_number").notNullable();
    table.timestamps(true, true);

    table
      .foreign("file_id")
      .references("identificator")
      .inTable("filemanager_files")
      .onDelete("CASCADE");

    table
      .foreign("index_file_id")
      .references("uuid_unique")
      .inTable("pinecone_index_files")
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
  await knex.schema.dropTable(tableName);
};
