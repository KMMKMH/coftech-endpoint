const tableName = "configs_templates";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const companyExtensionConfigs = {
    SCREENSHOT: [
      {
        key: "SCREENSHOT_TIMER",
        data: "",
        description: "Timer to take a screenshot if the user doesn't respond",
        data_type: "integer",
      },
    ],
  };

  for (const extension in companyExtensionConfigs) {
    const [existExtension] = await knex("extensions").where({
      "extensions.key": extension,
    });

    if (existExtension) {
      for (const config of companyExtensionConfigs[extension]) {
        await knex(tableName).insert({
          owner_type: "extension",
          key: config.key,
          data_default: config.data,
          description: config.description,
          data_type: config.data_type,
          extension_id: existExtension.uuid_unique,
        });

        const [insertedConfig] = await knex(tableName)
          .where({
            key: config.key,
            extension_id: existExtension.uuid_unique,
          })
          .orderBy("created_at", "desc")
          .limit(1);

        const configTemplateId = insertedConfig.uuid_unique;

        const botsWithExtension = await knex("bots_extensions").where({
          "bots_extensions.extension": existExtension.uuid_unique,
        });

        const companyIds = await knex("bots")
          .whereIn(
            "uuid_unique",
            botsWithExtension.map((bot) => bot.bot_id)
          )
          .select("company_id", "uuid_unique as bot_id");

        const companyConfigs = companyIds.map((company) => ({
          company_id: company.company_id,
          config_template_id: configTemplateId,
          bot_id: company.bot_id,
          data: config.data_default,
        }));

        if (companyConfigs.length > 0) {
          await knex("company_configs").insert(companyConfigs);
        }
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const companyExtensionConfigs = {
    SCREENSHOT: [
      {
        key: "SCREENSHOT_TIMER",
        data: "",
        description: "Timer to take a screenshot if the user doesn't respond",
        data_type: "integer",
      },
    ],
  };

  for (const extension in companyExtensionConfigs) {
    const [existExtension] = await knex("extensions").where({
      "extensions.key": extension,
    });

    if (existExtension) {
      for (const config of companyExtensionConfigs[extension]) {
        const [insertedConfig] = await knex(tableName)
          .where({
            key: config.key,
            extension_id: existExtension.uuid_unique,
          })
          .orderBy("created_at", "desc")
          .limit(1);

        if (insertedConfig) {
          const configTemplateId = insertedConfig.uuid_unique;

          await knex("company_configs")
            .where({
              config_template_id: configTemplateId,
            })
            .del();

          await knex(tableName)
            .where({
              uuid_unique: configTemplateId,
            })
            .del();
        }
      }
    }
  }
};
