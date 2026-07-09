const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = 'extensions_images';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, function (table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string('url').notNullable();
    table.string('identificator').notNullable();
    table.string('alter_text').notNullable();
    table.boolean("is_cover").defaultTo(false).notNullable();
    table.string('extension_id').notNullable();

    table.foreign('extension_id').references('uuid_unique').inTable('extensions').onDelete('CASCADE');
    table.timestamps(true, true);
  });

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
