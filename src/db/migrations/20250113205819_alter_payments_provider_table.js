const tableName = "payments_provider";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const paymentsProviders = await knex(tableName).select("name");

  for (const { name } of paymentsProviders) {
    const existExtension = await knex("extensions")
      .where({ key: name.toUpperCase() })
      .first();
    if (existExtension) {
      await knex(tableName)
        .where({ name })
        .update({ extension_id: existExtension.uuid_unique });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function () {};
