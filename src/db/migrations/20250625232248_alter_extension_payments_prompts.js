const extensionsTableName = "extensions";
const configsTemplatesTableName = "configs_templates";
const companyConfigsTableName = "company_configs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = async function (knex) {
  await knex(extensionsTableName)
    .where({ key: "PROMPT_PAYMENTS" })
    .update({
      key: "PAYMENT_SETTINGS",
      name: "Payment Settings",
      description: JSON.stringify({
        en: "Configure default currency and payment notification settings for transactions.",
        es: "Configure default currency and payment notification settings for transactions.",
        zh: "配置交易的默认货币和支付通知设置。",
      }),
    });

  const [extension] = await knex(extensionsTableName).where({
    key: "PAYMENT_SETTINGS",
  });

  if (!extension) {
    throw new Error("Extension PAYMENT_SETTINGS not found.");
  }

  await knex(configsTemplatesTableName)
    .where({
      key: "PROMPT_PAYMENTS_WP_GROUP",
    })
    .update({
      key: "PAYMENTS_SETTINGS_WP_GROUP",
    });

  await knex(configsTemplatesTableName)
    .where({
      key: "PROMPT_PAYMENTS_STATUS",
    })
    .update({
      key: "PAYMENTS_SETTINGS_DEFAULT_CURRENCY",
      data_type: "enum",
      data_default: "USD",
      description: "Default currency for payment processing.",
      extension_id: extension.uuid_unique,
    });

  const [configTemplate] = await knex(configsTemplatesTableName).where({
    key: "PAYMENTS_SETTINGS_DEFAULT_CURRENCY",
  });

  if (!configTemplate) {
    throw new Error(
      "Config template PAYMENTS_SETTINGS_DEFAULT_CURRENCY not found."
    );
  }

  await knex(companyConfigsTableName)
    .where({
      config_template_id: configTemplate.uuid_unique,
    })
    .update({
      data: configTemplate.data_default,
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(extensionsTableName).where({ key: "PAYMENT_SETTINGS" }).update({
    key: "PROMPT_PAYMENTS",
    name: "Prompt Payments",
    description: "Settings for prompt payment processing and management.",
  });
  await knex(configsTemplatesTableName)
    .where({ key: "PAYMENTS_SETTINGS_WP_GROUP" })
    .update({ key: "PROMPT_PAYMENTS_WP_GROUP" });
  return await knex(configsTemplatesTableName)
    .where({ key: "PAYMENTS_SETTINGS_DEFAULT_CURRENCY" })
    .update({
      key: "PROMPT_PAYMENTS_STATUS",
      data_type: "string",
      data_default: "",
      description: "Default currency for prompt payment processing.",
    });
};
