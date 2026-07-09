const tableName = 'call_center_sessions_logs';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable(tableName, table => {
    table.json('metadata').nullable();
    table.timestamp('started_at').nullable();
    table.timestamp('ended_at').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable(tableName, table => {
    table.dropColumn('metadata');
    table.dropColumn('started_at');
    table.dropColumn('ended_at');
  });
};
