const tableName = "storage_logs";
const columnName = "source";
const enumValues = ["filemanager", "desk", "whatsapp", "rag"];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.enum(columnName, enumValues).alter();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const previousEnumValues = ["filemanager", "desk", "whatsapp"];

  await knex.schema.alterTable(tableName, (table) => {
    table.enum(columnName, previousEnumValues).alter();
  });
};
