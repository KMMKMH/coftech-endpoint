const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "raffle_user_roles";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("user_id").notNullable();
    table.string("company_id").notNullable();
    table.string("role_id").notNullable();
    table.timestamps(true, true);

    table
      .foreign("company_id")
      .references("uuid_unique")
      .inTable("company")
      .onDelete("CASCADE");
    table
      .foreign("user_id")
      .references("uuid_unique")
      .inTable("raffle_users")
      .onDelete("CASCADE");
    table
      .foreign("role_id")
      .references("uuid_unique")
      .inTable("raffle_roles")
      .onDelete("CASCADE");

    table.unique(["user_id", "company_id"]);
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
