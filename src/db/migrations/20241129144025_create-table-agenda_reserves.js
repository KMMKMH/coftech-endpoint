const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "agenda_reserves";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("event_type_id").notNullable();
    table.string("status_id").notNullable();
    table.string("name").notNullable();
    table.dateTime("date").notNullable();
    table.json("participants").notNullable();
    table.json("phone_numbers").nullable().defaultTo(null);
    table.longtext("public_notes").nullable().defaultTo(null);
    table.longtext("private_notes").nullable().defaultTo(null);
    table.timestamps(true, true);

    table.foreign("company_id").references("uuid_unique").inTable("company");
    table.foreign("event_type_id").references("uuid_unique").inTable("agenda_event_types");
    table.foreign("status_id").references("uuid_unique").inTable("agenda_reserves_status");
  });

  await knex.raw(up(tableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down(tableName));
  await knex.schema.dropTableIfExists(tableName);
};
