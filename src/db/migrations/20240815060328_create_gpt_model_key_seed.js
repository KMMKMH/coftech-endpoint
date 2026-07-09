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
        key: "GPT_MODEL",
        company_id: company.uuid_unique,
      })
      .first();

    if (!existingConfig) {
      await knex(tableName).insert({
        key: "GPT_MODEL",
        data: "gpt-4o-mini",
        company_id: company.uuid_unique,
        description: "SPECIFIC GPT MODEL",
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
      key: "GPT_MODEL",
    })
    .del();
};
