const tableName = "payments";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.string("company_id").notNullable();
    table.string("payments_type").notNullable();
    table.string("bot_id").nullable().defaultTo(null).alter();
    table.text("provider_response", "longtext").nullable().defaultTo(null).alter();
    table.string("provider").nullable().defaultTo(null).alter();

    table.foreign("country").references("iso_alpha_3").inTable("countries");
    table.foreign("company_id").references("uuid_unique").inTable("company");
    table
      .foreign("payments_type")
      .references("uuid_unique")
      .inTable("payments_type");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function () {};
