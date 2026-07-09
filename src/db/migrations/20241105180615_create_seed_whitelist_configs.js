const tableName = "company_configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companies = await knex("company").select("uuid_unique");

  const configs = [
    {
      key: "RESPOND_ONLY_WHITELIST",
      data: false,
      description: "ALLOW RESPONSES ONLY TO WHITELISTED USERS",
      data_type: "boolean",
    },
    {
      key: "NON_WHITELIST_MESSAGE",
      data: "You are not authorized to receive a response.",
      description: "MESSAGE SHOWN TO NON-WHITELISTED USERS",
      data_type: "string",
    },
  ];

  for (const company of companies) {
    for (const config of configs) {
      const existingConfig = await knex(tableName)
        .where({
          key: config.key,
          company_id: company.uuid_unique,
        })
        .first();

      if (!existingConfig) {
        await knex(tableName).insert({
          key: config.key,
          data: config.data,
          company_id: company.uuid_unique,
          description: config.description,
          data_type: config.data_type,
        });
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName)
    .whereIn("key", ["RESPOND_ONLY_WHITELIST", "NON_WHITELIST_MESSAGE"])
    .del();
};
