const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "orders";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("transaction_id").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("item");
    table.string("amount");
    table.string("status");
    table.string("reason");
    table.longtext("extra1");
    table.longtext("extra2");
    table.longtext("extra3");
    table.longtext("extra4").notNullable().defaultTo("unsolicited");
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  await knex.raw(`
    CREATE TRIGGER orders_before_insert_extra_four
    BEFORE INSERT ON ${tableName}
    FOR EACH ROW
    SET NEW.extra4 = COALESCE(NEW.extra4, '{"default": "unsolicited"}');`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP TRIGGER IF EXISTS orders_before_insert_extra_four`);
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
