const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName).insert({
    key: "WHATSAPP_CALL_CONTROL",
    name: "whatsapp call control",
    icon: "FaPhone",
    description: {
      english:
        "Allows control over WhatsApp call reception status and auto-response messages for calls.",
      spanish:
        "Allows control over WhatsApp call reception status and auto-response messages for calls.",
    },
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName).where({ key: "WHATSAPP_CALL_CONTROL" }).del();
};
