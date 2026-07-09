const tableName = 'supported_languages';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.string("iso_639_1_code", 2).primary().notNullable();
  });

  await knex(tableName).insert([
    { iso_639_1_code: "es" },
    { iso_639_1_code: "en" },
    { iso_639_1_code: "zh" }
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTable(tableName);
};
