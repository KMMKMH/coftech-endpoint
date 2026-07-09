const tableName = "configs_templates";

exports.up = async function (knex) {
  const [extension] = await knex("extensions")
    .select("uuid_unique")
    .where({ key: "WHATSAPP_PROVIDER" });

  if (!extension) return;

  const extensionUuid = extension.uuid_unique;

  const templates = await knex(tableName)
    .select("uuid_unique")
    .where({ extension_id: extensionUuid });

  const templateUuids = templates.map((t) => t.uuid_unique);

  if (templateUuids.length > 0) {
    await knex("company_configs")
      .whereIn("config_template_id", templateUuids)
      .del();

    await knex(tableName).whereIn("uuid_unique", templateUuids).update({
      extension_id: null,
      owner_type: "company",
    });
  }

  const existTable = await knex.schema.hasTable("bots_extensions");

  if (existTable) {
    await knex("bots_extensions").where({ extension: extensionUuid }).del();
  }

  await knex("extensions").where({ uuid_unique: extensionUuid }).del();
};

exports.down = async function () {
  throw new Error("This migration is not automatically reversible.");
};
