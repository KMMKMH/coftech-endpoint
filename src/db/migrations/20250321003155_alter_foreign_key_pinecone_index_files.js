const tableName = "pinecone_index_files";
const indexName = "pinecone_index_files_file_id_foreign";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("file_id", indexName);
    table.dropIndex("file_id", indexName);

    table.index("file_id", indexName);

    table
      .foreign("file_id")
      .references("identificator")
      .inTable("filemanager_files");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("file_id");
    table
      .foreign("file_id")
      .references("uuid_unique")
      .inTable("filemanager_files");
  });
};
