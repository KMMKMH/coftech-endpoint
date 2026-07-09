const tableName = "extensions";
const templatesTableName = "configs_templates";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const [extension] = await knex(tableName).where({ key: "GLORIA_FOOD" });
  if (!extension) {
    console.log("Extension GLORIA_FOOD not found, skipping migration");
    return;
  }

  const { uuid_unique: extensionId } = extension;

  await Promise.all([
    knex(templatesTableName)
      .where({
        key: "GLORIA_FOOD_STATUS",
        extension_id: extensionId,
      })
      .update({
        name: "Paya Status",
        description: "Paya extension status.",
      }),
    knex(templatesTableName)
      .where({
        key: "GLORIA_FOOD_AUTH_TOKEN",
        extension_id: extensionId,
      })
      .update({
        name: "Paya Auth Token",
        description: "Paya authorization token.",
      }),
    knex(tableName)
      .where({
        uuid_unique: extensionId,
        key: "GLORIA_FOOD",
      })
      .update({
        name: "Paya",
        description: JSON.stringify({
          en: "Bot can search the restaurant menu with Paya.",
          es: "Bot can search the restaurant menu with Paya.",
          zh: "Bot can search the restaurant menu with Paya.",
        }),
      }),
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const [extension] = await knex(tableName).where({ key: "GLORIA_FOOD" });
  if (!extension) {
    return;
  }

  const { uuid_unique: extensionId } = extension;

  await Promise.all([
    knex(templatesTableName)
      .where({
        key: "GLORIA_FOOD_STATUS",
        extension_id: extensionId,
      })
      .update({
        name: "Gloria Food Status",
        description: "Gloria Food extension status.",
      }),
    knex(templatesTableName)
      .where({
        key: "GLORIA_FOOD_AUTH_TOKEN",
        extension_id: extensionId,
      })
      .update({
        name: "Gloria Food Auth Token",
        description: "Gloria Food authorization token.",
      }),
    knex(tableName)
      .where({
        uuid_unique: extensionId,
        key: "GLORIA_FOOD",
      })
      .update({
        name: "Gloria Food",
        description: JSON.stringify({
          en: "Bot can search the restaurant menu with Gloria Food.",
          es: "Bot can search the restaurant menu with Gloria Food.",
          zh: "Bot can search the restaurant menu with Paya.",
        }),
      }),
  ]);
};