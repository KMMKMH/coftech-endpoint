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
        key: "FILEMANAGER_LIMIT",
        company_id: company.uuid_unique,
      })
      .first();

    if (!existingConfig) {
      await knex(tableName).insert({
        key: "FILEMANAGER_LIMIT",
        data: "10",
        company_id: company.uuid_unique,
        description: "LIMIT UPLOADING FILES",
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
      key: "FILEMANAGER_LIMIT",
    })
    .del();
};
