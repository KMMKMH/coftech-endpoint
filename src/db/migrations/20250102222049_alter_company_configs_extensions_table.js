const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP TRIGGER IF EXISTS company_configs_before_insert_uuid`);

  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id");
    table.string("config_template_id");
    table.text("data", "longtext");
    table.timestamps(true, true);

    table
      .foreign("company_id", "fk_company_configs_company_id")
      .references("uuid_unique")
      .inTable("company");
    table
      .foreign("bot_id", "fk_company_configs_bot_id")
      .references("uuid_unique")
      .inTable("bots");
    table
      .foreign("config_template_id", "fk_company_configs_config_template_id")
      .references("uuid_unique")
      .inTable("configs_templates");
  });

  await knex.raw(up(tableName));

  const companyGlobalConfigs = await knex("company_configs_global").select("*");

  const companyExtensionConfigs = await knex(
    "company_configs_extensions"
  ).select("*");

  for (const configs of [...companyGlobalConfigs, ...companyExtensionConfigs]) {
    const ownerType = configs.extension ? "extension" : "company";
    const whereClause = configs.extension
      ? { owner_type: ownerType,extension_id: configs.extension,key: configs.key,}
      : { owner_type: ownerType, key: configs.key };

    const configTemplates = await knex("configs_templates")
      .select("uuid_unique", "key")
      .where(whereClause);

    for (const field of configTemplates) {
      await knex(tableName).insert({
        company_id: configs.company_id,
        ...(configs?.bot_id && { bot_id: configs.bot_id }),
        config_template_id: field.uuid_unique,
        ...(configs.key === field.key && { data: configs.data }),
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
  await knex.schema.dropTable(tableName);
};
