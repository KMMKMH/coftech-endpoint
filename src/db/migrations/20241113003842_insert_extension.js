const tableName = "extensions";
const extensionName = "CUSTOMER_SUPPORT_WP";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex(tableName).insert({
    key: extensionName,
    name: "Customer Support WP",
    icon: "FaUsers",
    description: {
      english: "Supports customer service via WhatsApp groups",
      spanish: "Supports customer service through WhatsApp groups",
    },
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex(tableName).where({ key: extensionName }).del();
};
