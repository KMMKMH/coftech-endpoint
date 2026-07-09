const tableName = "extensions_categories";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const brainCategory = await knex(tableName)
    .where({ key: "BRAIN" })
    .select("uuid_unique")
    .first();

  if (!brainCategory) {
    console.log("Category BRAIN not found, skipping migration");
    return;
  }

  await knex(tableName)
    .where({ uuid_unique: brainCategory.uuid_unique })
    .update({ name: "LLM", key: "LLM" });

  console.log("Category BRAIN renamed to LLM successfully");

  const openAiExtension = await knex("extensions")
    .where({ key: "OPEN_AI_SERVICE" })
    .select("uuid_unique", "category_id")
    .first();

  if (openAiExtension) {
    await knex("extensions")
      .where({ key: "OPEN_AI_SERVICE" })
      .update({ category_id: brainCategory.uuid_unique });

    console.log(
      "Extension OPEN_AI_SERVICE category updated to LLM successfully"
    );
  } else {
    console.log("Extension OPEN_AI_SERVICE not found");
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const llmCategory = await knex(tableName)
    .where({ key: "LLM" })
    .select("uuid_unique")
    .first();

  if (!llmCategory) {
    console.log("Category LLM not found, skipping rollback");
    return;
  }

  await knex(tableName)
    .where({ uuid_unique: llmCategory.uuid_unique })
    .update({ key: "BRAIN", name: "BRAIN" });

  console.log("Category LLM renamed back to BRAIN successfully");

  const botUtilitiesCategory = await knex(tableName)
    .where({ key: "BOT_UTILITIES" })
    .select("uuid_unique")
    .first();

  const openAiExtension = await knex("extensions")
    .where({ key: "OPEN_AI_SERVICE" })
    .select("uuid_unique")
    .first();

  if (openAiExtension && botUtilitiesCategory) {
    await knex("extensions")
      .where({ uuid_unique: openAiExtension.uuid_unique })
      .update({ category_id: botUtilitiesCategory.uuid_unique });

    console.log(
      "Extension OPEN_AI_SERVICE category reverted to BOT_UTILITIES successfully"
    );
  } else {
    console.log(
      "Extension OPEN_AI_SERVICE or BOT_UTILITIES category not found"
    );
  }
};
