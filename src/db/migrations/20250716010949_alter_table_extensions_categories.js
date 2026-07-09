/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const trx = await knex.transaction();

  try {
    const hasKey = await trx.schema.hasColumn("extensions_categories", "key");
    if (!hasKey) {
      await trx.schema.alterTable("extensions_categories", (table) => {
        table.renameColumn("name", "key");
      });

      await trx.schema.alterTable("extensions_categories", (table) => {
        table.unique("key");
      });
    }

    const hasName = await trx.schema.hasColumn("extensions_categories", "name");
    if (!hasName) {
      await trx.schema.alterTable("extensions_categories", (table) => {
        table.string("name").notNullable();
      });
    }

    await trx.raw(`
      UPDATE extensions_categories
      SET name = CONCAT(
        UPPER(SUBSTRING(LOWER(REPLACE(\`key\`, '_', ' ')), 1, 1)),
        SUBSTRING(LOWER(REPLACE(\`key\`, '_', ' ')), 2)
      )
    `);

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const trx = await knex.transaction();

  try {
    const hasName = await trx.schema.hasColumn("extensions_categories", "name");
    if (hasName) {
      await trx.schema.alterTable("extensions_categories", (table) => {
        table.dropColumn("name");
      });
    }

    const hasKey = await trx.schema.hasColumn("extensions_categories", "key");
    const hasNameAfterDrop = await trx.schema.hasColumn(
      "extensions_categories",
      "name"
    );
    if (hasKey && !hasNameAfterDrop) {
      await trx.schema.alterTable("extensions_categories", (table) => {
        table.dropUnique("key");
      });

      await trx.schema.alterTable("extensions_categories", (table) => {
        table.renameColumn("key", "name");
      });
    }

    await trx.commit();
  } catch (error) {
    await trx.rollback();
    throw error;
  }
};
