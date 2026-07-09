const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "call_center_departments_schedule_off";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("department_id").notNullable();
    table.date("date").notNullable();
    table.text("reason").nullable();
    table.timestamps(true, true);

    table
      .foreign("department_id")
      .references("uuid_unique")
      .inTable("call_center_departments");
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
