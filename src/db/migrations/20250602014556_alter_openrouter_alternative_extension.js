const tableName = "configs_templates";
const keyName = "BRAIN_OPENROUTER_ALTERNATIVE_MODELS";
const ownerType = "extension";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable(tableName, function(table) {
    table
      .enum("data_type", [
        "string",
        "integer",
        "boolean",
        "enum",
        "float",
        "time",
        "cron",
        "string_commas",
        "json",
        "json_array",
        "array",
        "enum_array",
      ])
      .notNullable()
      .alter();
  });
  
  await knex(tableName)
    .where({ key: keyName, owner_type: ownerType })
    .update({ data_type: "enum_array" });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable(tableName, function (table) {
    table
      .enum("data_type", [
        "string",
        "integer",
        "boolean",
        "enum",
        "float",
        "time",
        "cron",
        "string_commas",
        "json",
        "json_array",
        "array",
      ])
      .notNullable()
      .alter();
  });

  await knex(tableName)
    .where({ key: keyName, owner_type: ownerType })
    .update({ data_type: "array" });
};
