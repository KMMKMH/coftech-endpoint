const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "blacklist";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();
    table.string("phone").notNullable();
    table.enu("type", ["CLIENT", "BOT"]).defaultTo("CLIENT").notNullable();
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("bot_id").references("uuid_unique").inTable("bots");
  });

  await knex.schema.raw(`
    ALTER TABLE ${tableName}
    ADD CONSTRAINT unique_bot_phone UNIQUE (bot_id, phone)
  `);

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTableIfExists(tableName);
};
