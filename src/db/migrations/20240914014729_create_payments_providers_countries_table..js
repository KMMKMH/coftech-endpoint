const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "payments_provider_country";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.increments("id").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("provider").notNullable();
    table.string("country").notNullable();
    table.timestamps(true, true);

    table.unique(["provider", "country"]);

    table.foreign("country").references("iso_alpha_3").inTable("countries");
  });

  await knex.raw(up(tableName));

  const providerNMI = await knex("payments_provider")
    .where({ name: "NMI" })
    .first();

  await knex(tableName).insert([
    {
      provider: providerNMI.uuid_unique,
      country: "PAN",
    },
    {
      provider: providerNMI.uuid_unique,
      country: "USA",
    },
  ]);

  const providerPaya = await knex("payments_provider")
    .where({ name: "Paya¡" })
    .first();

  await knex(tableName).insert([
    {
      provider: providerPaya.uuid_unique,
      country: "PAN",
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
