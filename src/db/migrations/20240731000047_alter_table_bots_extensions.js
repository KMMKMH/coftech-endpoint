const tableName = "bots_extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.foreign("extension").references("uuid_unique").inTable("extensions");
    table.unique(["bot_id", "extension"]);
  });

  const companyField = await knex("company").select("uuid_unique").first();
  const botField = await knex("bots")
    .where({ "bots.company_id": companyField.uuid_unique })
    .first();

  const [extensionField] = await knex("extensions").where({
    key: "SCREENSHOT_WORD",
  });

  const existingExtension = await knex(tableName)
    .where({
      bot_id: botField.uuid_unique,
      extension: extensionField.uuid_unique,
    })
    .first();

  if (!existingExtension) {
    await knex(tableName).insert({
      bot_id: botField.uuid_unique,
      extension: extensionField.uuid_unique,
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropForeign("extension");
    table.dropUnique(["bot_id", "extension"]);
  });
};
