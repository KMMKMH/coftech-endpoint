const tableName = "company_configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companies = await knex("company").select("uuid_unique");

  for (const company of companies) {
    await knex(tableName)
      .where({
        key: "SCREENSHOT_DATA_CUSTOM_FIELDS",
        company_id: company.uuid_unique,
      })
      .update({
        data_type: "string_commas",
      });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ key: "SCREENSHOT_DATA_CUSTOM_FIELDS" }).update({
    data_type: "string",
  });
};
