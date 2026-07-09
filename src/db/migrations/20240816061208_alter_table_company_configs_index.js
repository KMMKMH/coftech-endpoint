const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`
    ALTER TABLE ${tableName}
    DROP FOREIGN KEY company_configs_company_id_foreign;
  `);
  await knex.raw(`
    ALTER TABLE ${tableName}
    DROP INDEX company_configs_company_id_key_unique;`);

  await knex.schema.table(tableName, (table) => {
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
    table.unique(["company_id", "key", "bot_id"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.table(tableName, (table) => {
    table.dropUnique(["company_id", "key", "bot_id"]);

    table.unique(["company_id", "key"]);
  });
};
