const { up, down } = require("../../utils/uuid_v4_trigger");
const {
  retrieveCountryCurrencies,
} = require("../../utils/retrieveCountryCurrencies");
const tableName = "currencies";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("name").notNullable();
    table.string("symbol").notNullable();
    table.string("code").notNullable();
    table.string("country_id").notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamps(true, true);

    table
      .foreign("country_id")
      .references("uuid_unique")
      .inTable("countries")
      .onDelete("RESTRICT");
  });

  await knex.raw(up(tableName));

  try {
    const currencies = await retrieveCountryCurrencies();
    if (currencies.length > 0) {
      await knex(tableName).insert(currencies);
    }
  } catch (error) {
    console.error("Error retrieving country currencies:", error);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
