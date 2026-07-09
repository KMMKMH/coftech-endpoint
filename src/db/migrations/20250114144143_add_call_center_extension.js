const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const { uuid_unique: customerSupportID } = await knex("extensions_categories")
    .where({ name: "CUSTOMER_SUPPORT" })
    .select("uuid_unique")
    .first();

  await knex(tableName).insert({
    key: "CALL_CENTER",
    name: "Call Center",
    icon: "FaPhoneVolume",
    description: JSON.stringify({
      en: "This extension allows for the management of customer service through messages. It provides tools for handling customer interactions, tracking communication metrics, and improving customer service efficiency.",
      es: "This extension allows customer service management through messages. It provides tools for handling customer interactions, tracking communication metrics, and improving customer service efficiency.",
    }),
    category_id: customerSupportID,
  });

  const { uuid_unique: callCenterExtensionID } = await knex(tableName)
    .where({ key: "CALL_CENTER" })
    .select("uuid_unique")
    .first();

  const callCenterConfigTemplate = [
    {
      owner_type: "extension",
      key: "CALL_CENTER_STATUS",
      data_default: "false",
      data_type: "boolean",
      description: "Allow to enable or disable the call center extension",
      extension_id: callCenterExtensionID,
    },
    {
      owner_type: "extension",
      key: "CALL_CENTER_QUEUE_TIMEOUT",
      data_default: "01:00",
      data_type: "time",
      description: "Time in hours to wait for a response from the agent",
      extension_id: callCenterExtensionID,
    }
  ];

  await knex("configs_templates").insert(callCenterConfigTemplate);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const configs = [
    "CALL_CENTER_STATUS",
    "CALL_CENTER_QUEUE_TIMEOUT",
  ];
  await knex("configs_templates").whereIn("key", configs).del();
  await knex(tableName).where({ key: "CALL_CENTER" }).del();
};
