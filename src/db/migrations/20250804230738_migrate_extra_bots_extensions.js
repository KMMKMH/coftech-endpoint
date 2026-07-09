const tableNameTo = "extra_bots_extensions";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const extensionsToMigrate = await knex
    .select(["be.extension AS extension_id", "be.bot_id", "be.status"])
    .from("bots_extensions AS be")
    .leftJoin("plans_extensions AS pe", "be.extension", "pe.extension_id")
    .whereNull("pe.extension_id");

  if (extensionsToMigrate.length === 0) {
    return;
  }

  await knex(tableNameTo).insert(extensionsToMigrate);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.truncate(tableNameTo);
};
