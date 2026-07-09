const tableName = "pinecone_index_namespace_map";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.renameTable(tableName, "pinecone_index_files");

  await knex.schema.alterTable("pinecone_index_files", (table) => {
    table.renameColumn("namespace", "file_id");
    table
      .foreign("file_id")
      .references("uuid_unique")
      .inTable("filemanager_files");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("pinecone_index_files", (table) => {
    table.dropForeign("file_id");
    table.renameColumn("file_id", "namespace");
  });

  await knex.schema.renameTable("pinecone_index_files", tableName);
};
