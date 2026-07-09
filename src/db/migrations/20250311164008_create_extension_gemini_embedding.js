const extensionTable = "extensions";
const extCategoryTable = "extensions_categories";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex("extensions_categories").insert({
    name: "RAG",
    unique: 0,
    dynamic: 0,
  });

  const { uuid_unique: ragCategoryID } = await knex(extCategoryTable)
    .where({ name: "RAG" })
    .select("uuid_unique")
    .first();

  await knex(extensionTable).insert({
    key: "GEMINI",
    name: "Gemini",
    icon: "FaBrain",
    description: JSON.stringify({
      english:
        "Uses Google Gemini for generating text embeddings in RAG (Retrieval-Augmented Generation).",
      spanish:
        "Uses Google Gemini to generate text embeddings in RAG (Retrieval-Augmented Generation).",
    }),
    category_id: ragCategoryID,
  });

  const { uuid_unique: geminiExtensionID } = await knex(extensionTable)
    .where({ key: "GEMINI" })
    .select("uuid_unique")
    .first();

  const geminiConfigTemplate = [
    {
      owner_type: "extension",
      key: "GEMINI_STATUS",
      data_default: "false",
      data_type: "boolean",
      description: "Allow to enable or disable gemini extension",
      extension_id: geminiExtensionID,
    },
    {
      owner_type: "extension",
      key: "GEMINI_API_KEY",
      data_default: "",
      data_type: "string",
      description:
        "API key required to authenticate requests to Google Gemini services.",
      extension_id: geminiExtensionID,
    },
    {
      owner_type: "extension",
      key: "GEMINI_RAG_MODEL",
      data_default: "text-embedding-004",
      data_type: "string",
      description:
        "Specifies the default embedding model used for the Gemini RAG extension.",
      extension_id: geminiExtensionID,
    },
  ];

  await knex("configs_templates").insert(geminiConfigTemplate);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const configs = ["GEMINI_STATUS", "GEMINI_API_KEY", "GEMINI_RAG_MODEL"];

  await knex("configs_templates").whereIn("key", configs).del();

  const geminiExtension = await knex("extensions")
    .where({ key: "GEMINI" })
    .select("uuid_unique")
    .first();

  if (geminiExtension) {
    await knex("bots_extensions")
      .where({ extension: geminiExtension.uuid_unique })
      .del();

    await knex("extensions").where({ key: "GEMINI" }).del();
  }
};
