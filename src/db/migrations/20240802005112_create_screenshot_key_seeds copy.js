const tableName = "company_configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companies = await knex("company").select("uuid_unique");

  for (const company of companies) {
    const existingConfig = await knex(tableName)
      .where({
        key: "SCREENSHOT_WORD",
        company_id: company.uuid_unique,
      })
      .first();

    if (!existingConfig) {
      await knex(tableName).insert({
        key: "SCREENSHOT_WORD",
        data: "",
        company_id: company.uuid_unique,
        description: "KEY WORD TO TAKE SCREENSHOT",
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName)
    .where({
      key: "SCREENSHOT_WORD",
    })
    .del();
};
