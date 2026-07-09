const tableName = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const [extension] = await knex("extensions").where({
    key: "GOOGLE_CALENDAR",
  });

  await knex(tableName).insert({
    owner_type: "extension",
    key: "GOOGLE_CALENDAR_APPOINTMENT_DURATION",
    data_default: "01:00",
    data_type: "time",
    description: "Appointment duration for Google Calendar",
    extension_id: extension.uuid_unique,
  });

  const [template] = await knex(tableName).where({
    key: "GOOGLE_CALENDAR_APPOINTMENT_DURATION",
  });

  const botsWithCalendar = await knex("bots_extensions").where({
    extension: extension.uuid_unique,
  });

  for (const b of botsWithCalendar) {
    const bot = await knex("bots").where({ uuid_unique: b.bot_id }).first();

    await knex("company_configs").insert({
      company_id: bot.company_id,
      bot_id: bot.uuid_unique,
      config_template_id: template.uuid_unique,
      data: template.data_default,
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const [template] = await knex(tableName).where({
    key: "GOOGLE_CALENDAR_APPOINTMENT_DURATION",
  });

  await knex("company_configs")
    .where({
      config_template_id: template.uuid_unique,
    })
    .del();

  await knex(tableName)
    .where({
      uuid_unique: template.uuid_unique,
    })
    .del();
};
