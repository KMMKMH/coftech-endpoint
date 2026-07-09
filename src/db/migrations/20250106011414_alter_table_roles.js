const tableName = "roles";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, function (table) {
    table.dropUnique("name");
    table
      .string("company_id")
      .nullable()
      .references("uuid_unique")
      .inTable("company")
      .onDelete("SET NULL")
      .after("name");

    table.unique(["name", "company_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(tableName, function (table) {
    table.dropColumn("company_id");
    table.unique("name");
    table.dropUnique(["name", "company_id"]);
  });
};
