const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "file_manager";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("name").notNullable();
    table.string("extension").notNullable();
    table.boolean("status").notNullable().defaultTo(true);
    table.bigint("identificator").unique().notNullable();
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table
      .foreign("extension")
      .references("uuid_unique")
      .inTable("file_manager_types");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
