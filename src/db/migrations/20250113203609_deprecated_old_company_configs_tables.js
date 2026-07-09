/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.dropTableIfExists('company_configs_global');
  await knex.schema.dropTableIfExists('company_configs_extensions');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function() {
};
