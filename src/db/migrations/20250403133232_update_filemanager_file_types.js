const tableName = "file_manager_types";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex(tableName).whereIn("key", ["PNG", "XLSX", "JPG"]).del();

  await knex(tableName).insert({
    key: "TXT",
    name: "txt"
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex(tableName).where("key", "TXT").del();

  await knex(tableName).insert([
    { key: "PNG", name: "png" },
    { key: "XLSX", name: "xlsx" },
    { key: "JPG", name: "jpg" }
  ]);
};
