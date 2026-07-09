const tableName = "company_configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companyField = await knex("company").select("uuid_unique").first();

  await knex(tableName).insert([
    {
      key: "FILEMANAGER_LIMIT",
      data: "10",
      company_id: companyField.uuid_unique,
      description: "LIMIT UPLOADING FILES",
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const companyField = await knex("company").select("uuid_unique").first();

  knex(tableName)
    .where({
      key: "FILEMANAGER_LIMIT",
      company_id: companyField.uuid_unique,
    })
    .del();
};
