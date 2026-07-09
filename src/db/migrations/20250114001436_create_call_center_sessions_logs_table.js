const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_sessions_logs";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) AUTO_INCREMENT NOT NULL").primary();
    table.string("uuid_unique").notNullable().unique();
    table.string("asesor_id").notNullable();
    table.string("contact_id").notNullable();
    table.json("messages_id").nullable().defaultTo(null);
    table.timestamps(true, true);

    table.foreign("asesor_id").references("uuid_unique").inTable("accounts");
    table.foreign("contact_id").references("uuid_unique").inTable("social_contacts");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
