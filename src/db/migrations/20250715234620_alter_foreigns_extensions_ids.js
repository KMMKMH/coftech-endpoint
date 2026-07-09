/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

const foreignKeysToUpdate = [
  {
    table: "configs_templates",
    column: "extension_id",
    referencedTable: "extensions",
    referencedColumn: "uuid_unique",
    constraintName: "configs_templates_extension_id_foreign",
  },
  {
    table: "extensions_images",
    column: "extension_id",
    referencedTable: "extensions",
    referencedColumn: "uuid_unique",
    constraintName: "extensions_images_extension_id_foreign",
  },
  {
    table: "payments_provider",
    column: "extension_id",
    referencedTable: "extensions",
    referencedColumn: "uuid_unique",
    constraintName: "payments_provider_extension_id_foreign",
  },
];

exports.up = async function (knex) {
  for (const fk of foreignKeysToUpdate) {
    await knex.schema.alterTable(fk.table, (table) => {
      table.dropForeign(fk.column, fk.constraintName);
    });

    await knex.schema.alterTable(fk.table, (table) => {
      table
        .foreign(fk.column, fk.constraintName)
        .references(`${fk.referencedTable}.${fk.referencedColumn}`)
        .onDelete("CASCADE");
    });
  }
};

exports.down = async function (knex) {
  for (const fk of foreignKeysToUpdate) {
    await knex.schema.alterTable(fk.table, (table) => {
      table.dropForeign(fk.column, fk.constraintName);
    });

    await knex.schema.alterTable(fk.table, (table) => {
      table
        .foreign(fk.column, fk.constraintName)
        .references(`${fk.referencedTable}.${fk.referencedColumn}`)
        .onDelete("RESTRICT");
    });
  }
};
