const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table
      .enum("owner_type", ["company", "extension", "agenda", "raffle"])
      .notNullable();
    table.string("key").notNullable();
    table.text("data_default", "longtext");
    table.string("description").notNullable();
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
      ])
      .notNullable();
    table.json("data_options");
    table.boolean("internal").defaultTo(false);
    table.string("extension_id");
    table.timestamps(true, true);

    table
      .foreign("extension_id")
      .references("uuid_unique")
      .inTable("extensions");
    table.unique(["owner_type", "key"]);
    table.index(["owner_type", "key"]);
  });

  await knex.raw(
    `
    ALTER TABLE ?? ADD CONSTRAINT check_owner_type_extension CHECK (
      (owner_type IN ('company', 'agenda', 'raffle') AND extension_id IS NULL) OR 
      (owner_type = 'extension' AND extension_id IS NOT NULL)
    )
  `,
    [tableName]
  );

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
