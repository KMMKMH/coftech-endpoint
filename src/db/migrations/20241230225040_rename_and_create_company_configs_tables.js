const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "company_configs";
const newTableName = "company_configs_global";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.renameTable(tableName, "company_configs_extensions");

  const copiedData = await knex("company_configs_extensions")
    .select(
      "company_id",
      "key",
      "data",
      "description",
      "data_type",
      "internal",
      "data_options",
      "created_at",
      "updated_at"
    )
    .where("bot_id", null);

  await knex.schema.createTable(newTableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("key").notNullable();
    table.string("data");
    table.string("description");
    table.string("data_type");
    table.string("data_options");
    table.boolean("internal").defaultTo(false);
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.unique(["company_id", "key"]);
  });

  await knex.raw(up(newTableName));

  for (const row of copiedData) {
    await knex(newTableName).insert(row);
  }

  await knex("company_configs_extensions").where("bot_id", null).del();
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.renameTable("company_configs_extensions", tableName);
  await knex.raw(down(newTableName));
  await knex.schema.dropTable(newTableName);
};
