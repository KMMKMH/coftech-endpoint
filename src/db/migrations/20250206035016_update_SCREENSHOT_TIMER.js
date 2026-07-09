const tableName = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).where({ key: "SCREENSHOT_TIMER" }).update({
    data_default: 3,
    description:
      "Timer in minutes to take a screenshot if the user doesn't respond",
  });

  const { uuid_unique: screenshotTimerConfig } = await knex(tableName)
    .where({ key: "SCREENSHOT_TIMER" })
    .select("uuid_unique")
    .first();

  await knex("company_configs")
    .where({ config_template_id: screenshotTimerConfig })
    .update({
      data: 3,
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ key: "SCREENSHOT_TIMER" }).update({
    data_default: null,
    description: "Timer to take a screenshot if the user doesn't respond",
  });

  const {uuid_unique: screenshotTimerConfig } = await knex(tableName)
    .where({ key: "SCREENSHOT_TIMER" })
    .select("uuid_unique").first();

  await knex("company_configs")
    .where({ config_template_id: screenshotTimerConfig })
    .update({
      data: null,
    });
};
