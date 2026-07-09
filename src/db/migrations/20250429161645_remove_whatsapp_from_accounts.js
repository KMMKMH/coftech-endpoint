const tableName = "accounts";
const logger = require("../../utils/logger");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, function (table) {
    table.dropColumn('whatsapp');
  });

  await knex.transaction(async (trx) => {
    try {
      const phones = await trx(tableName).select("uuid_unique", "phone");

      const updates = phones.map(({ uuid_unique, phone }) => {
        const newNumber = phone?.replace(/\D/g, '');
        return trx(tableName)
          .where({ uuid_unique })
          .update({ phone: newNumber });
      });

      await Promise.all(updates);
    }
    catch (error) {
      logger.error(`Error updating phone numbers:`, error);
      throw error
    }
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, function (table) {
    table.string('whatsapp');
  });
};

exports.config = { transaction: false }