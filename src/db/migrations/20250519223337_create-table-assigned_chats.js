const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = 'assigned_chats';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();
    table.string("user_id").notNullable();
    table.string("phone_number").notNullable().index();
    table.timestamp("assigned_at").notNullable();
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company").onDelete("CASCADE");
    table.foreign("bot_id").references("uuid_unique").inTable("bots").onDelete("CASCADE");
    table.foreign("user_id").references("uuid_unique").inTable("accounts").onDelete("CASCADE");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
