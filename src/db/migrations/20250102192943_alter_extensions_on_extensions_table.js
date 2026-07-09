const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const extensionToDelete = ["DEMO_PAYMENTS", "SCREENSHOT_SERVICE"];

  const extensions = await knex(tableName);
  for (const extension of extensions) {
    if (extensionToDelete.includes(extension.key)) {
      await knex("company_configs_extensions")
        .where({ extension: extension.uuid_unique })
        .del();
      await knex("bots_extensions").where({ extension: extension.uuid_unique }).del();
      await knex(tableName).where({ uuid_unique: extension.uuid_unique }).del();
    }
  }

  await knex(tableName)
    .where({ key: "SCREENSHOT_DATA" })
    .update({
      key: "SCREENSHOT",
      name: "Screenshot",
      icon: "FaCamera",
      description: JSON.stringify({
        english: "Allows the bot to take screenshots.",
        spanish: "Permite al bot realizar capturas de pantalla.",
      }),
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName)
    .where({ key: "SCREENSHOT" })
    .update({
      key: "SCREENSHOT_DATA",
      name: "Screenshot Data",
      icon: "FaCamera",
      description: JSON.stringify({
        english: "Bot sends a screenshot with orders data",
        spanish:
          "Bot sends a screenshot with order data",
      }),
    });
};
