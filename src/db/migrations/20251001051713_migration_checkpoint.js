const tableName = "migration_checkpoints";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.increments("id").primary();
    table.string("migration_name", 255).notNullable();
    table.integer("last_batch_id").notNullable().defaultTo(0);
    table.integer("records_processed").notNullable().defaultTo(0);
    table.integer("records_inserted").notNullable().defaultTo(0);
    table.integer("records_skipped").notNullable().defaultTo(0);
    table.integer("records_errored").notNullable().defaultTo(0);
    table
      .enum("status", ["running", "completed", "failed"])
      .notNullable()
      .defaultTo("running");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index("migration_name");
    table.index(["migration_name", "status"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists(tableName);
};
