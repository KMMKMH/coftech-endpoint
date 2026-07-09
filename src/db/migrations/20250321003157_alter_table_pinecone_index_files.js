const tableName = "pinecone_index_files";
const referencedTable = "filemanager_files";
const referencedColumn = "identificator";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("file_id");

    table
      .foreign("file_id")
      .references(referencedColumn)
      .inTable(referencedTable)
      .onDelete("CASCADE");
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
      .references(referencedColumn)
      .inTable(referencedTable);
  });
};
