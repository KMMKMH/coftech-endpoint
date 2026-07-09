const tableName = "bots";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.boolean("suspended").defaultTo(true).alter();
  });

  await knex(tableName).update({ suspended: true });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.boolean("suspended").defaultTo(false).alter();
  });

  await knex(tableName).update({ suspended: false });
};
