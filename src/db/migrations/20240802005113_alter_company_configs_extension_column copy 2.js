const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("extension").nullable().defaultTo(null);
    table.foreign("extension").references("uuid_unique").inTable("extensions");
  });

  const [extensionField] = await knex("extensions").where({
    key: "SCREENSHOT_WORD",
  });

  const companyConfigGroupSupport = await knex("company_configs").where({
    key: "WP_GROUP_SUPPORT",
  });

  for (const config of companyConfigGroupSupport) {
    await knex("company_configs")
      .where({ id: config.id })
      .update({ extension: extensionField.uuid_unique });
  }

  const companyConfigScreenshotWord = await knex("company_configs").where({
    key: "SCREENSHOT_WORD",
  });

  for (const config of companyConfigScreenshotWord) {
    await knex("company_configs")
      .where({ id: config.id })
      .update({ extension: extensionField.uuid_unique });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function () {};
