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
        key: "WP_GROUP_SUPPORT",
        company_id: company.uuid_unique,
      })
      .first();

    if (!existingConfig) {
      await knex(tableName).insert({
        key: "WP_GROUP_SUPPORT",
        data: "",
        company_id: company.uuid_unique,
        description: "GROUP SUPPORT NAME",
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
      key: "WP_GROUP_SUPPORT",
    })
    .del();
};
