const tableName = "payments";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [coutry] = await knex("countries")
    .select("uuid_unique")
    .where("iso_alpha_3", "USA");
  const currencies = await knex("currencies")
    .select("code", "uuid_unique")
    .where("country_id", coutry.uuid_unique);

  const payments = await knex(tableName).select("currency", "uuid_unique");
  for (const payment of payments) {
    const currency = currencies.find(
      (currency) => currency.code === payment.currency
    );
    if (currency) {
      await knex(tableName)
        .where("uuid_unique", payment.uuid_unique)
        .update("currency", currency.uuid_unique);
    }
  }

  await knex.schema.alterTable(tableName, (table) => {
    table.foreign("currency").references("uuid_unique").inTable("currencies");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("currency");
  });
};
