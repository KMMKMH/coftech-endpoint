const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "agenda_company_configs";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("key").notNullable();
    table.string("data").notNullable();
    table.string("description").notNullable();
    table.string("data_type").notNullable();
    table.json("data_options").nullable().defaultTo(null);
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
  });

  const company_configs = [
    {
      key: "MEET_OVERLAP",
      data: "0",
      description: "Number of allowed meetings at the same time, by default 0 (unlimited).",
      data_type: "integer",
      data_options: null
    }
  ]

  await knex.raw(up(tableName));

  const companies = await knex("company").select("uuid_unique");
  for (const company of companies) {
    for (const config of company_configs) {
      await knex(tableName).insert({
        company_id: company.uuid_unique,
        key: config.key,
        data: config.data,
        description: config.description,
        data_type: config.data_type,
        data_options: config.data_options
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTableIfExists(tableName);
};
