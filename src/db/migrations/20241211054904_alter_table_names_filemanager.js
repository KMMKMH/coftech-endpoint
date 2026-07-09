const tableRenames = [
  { oldName: "filemanager_bases", newName: "desk_bases" },
  { oldName: "filemanager_tables", newName: "desk_tables" },
  { oldName: "filemanager_columns", newName: "desk_columns" },
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  for (const { oldName, newName } of tableRenames) {
    await knex.schema.renameTable(oldName, newName);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  for (const { oldName, newName } of tableRenames) {
    await knex.schema.renameTable(newName, oldName);
  }
};
