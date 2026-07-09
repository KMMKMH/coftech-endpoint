const extensionTable = "extensions";
const extensionCategoryTable = "extensions_categories";
const configTemplateTable = "configs_templates";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(extensionCategoryTable).insert({
    name: "VECTOR_DATABASE",
    unique: true,
    dynamic: false,
  });
  const [category] = await knex(extensionCategoryTable).where({
    name: "VECTOR_DATABASE",
  });

  await knex(extensionTable).insert({
    key: "PINECONE",
    name: "Pinecone",
    icon: "FaProjectDiagram",
    description: {
      en: "Pinecone is a vector database that enables you to search and retrieve similar items in high-dimensional vector spaces.",
      es: "Pinecone is a vector database that lets you search and retrieve similar items in high-dimensional vector spaces.",
    },
    category_id: category.uuid_unique,
  });

  const [extension] = await knex(extensionTable).where({ key: "PINECONE" });

  await knex(configTemplateTable).insert([
    {
      owner_type: "extension",
      key: "PINECONE_STATUS",
      data_default: "false",
      description: "Allow to enable or disable the Pinecone extension",
      data_type: "boolean",
      extension_id: extension.uuid_unique,
    },
    {
      owner_type: "extension",
      key: "PINECONE_API_KEY",
      data_default: "",
      description: "Pinecone API Key",
      data_type: "string",
      extension_id: extension.uuid_unique,
    },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(configTemplateTable)
    .whereIn("key", ["PINECONE_STATUS", "PINECONE_API_KEY"])
    .del();
  await knex(extensionTable).where({ key: "PINECONE" }).del();
  await knex(extensionCategoryTable).where({ name: "VECTOR_DATABASE" }).del();
};
