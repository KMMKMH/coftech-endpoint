/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('dashboard_logs', (table) => {
    table.index(['company_id', 'created_at'], 'idx_dashboardlogs_companyid_createdat');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('dashboard_logs', (table) => {
    table.dropIndex(['company_id', 'created_at'], 'idx_dashboardlogs_companyid_createdat');
  });
};
