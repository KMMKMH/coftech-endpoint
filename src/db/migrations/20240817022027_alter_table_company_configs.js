const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("data_type").notNullable();
  });

  const configs = {
    HUMANIZE_RESPONSE: "boolean",
    GPT_MODEL: "string",
    SCREENSHOT_WORD: "string",
    WP_GROUP_SUPPORT: "string",
    OPENAI_KEY: "string",
    FILEMANAGER_LIMIT: "integer",
  };

  for (const [key, data_type] of Object.entries(configs)) {
    await knex(tableName).where({ key }).update({ data_type });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("data_type");
  });
};
