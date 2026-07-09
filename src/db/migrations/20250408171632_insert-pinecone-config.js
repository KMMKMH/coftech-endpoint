/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const extension = await knex("extensions")
    .where({ key: "PINECONE" })
    .first();

  await knex("configs_templates").insert({
    owner_type: "extension",
    key: "PINECONE_RERANKING",
    data_type: "boolean",
    data_default: "false",
    description: "Enable RAG Reranking for more accurate results (but increases the pinecone cost)",
    extension_id: extension.uuid_unique,
  });

  const template = await knex("configs_templates")
    .where({ key: "PINECONE_RERANKING" })
    .first();

  const botsWithPinecone = await knex("bots_extensions").where({
    extension: extension.uuid_unique,
  });

  for (const b of botsWithPinecone) {
    const bot = await knex("bots")
      .where({ uuid_unique: b.bot_id })
      .first();

    await knex("company_configs").insert({
      company_id: bot.company_id,
      bot_id: bot.uuid_unique,
      config_template_id: template.uuid_unique,
      data: template.data_default,
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const extension = await knex("extensions")
    .where({ key: "PINECONE" })
    .first();

  const template = await knex("configs_templates")
    .where({ key: "PINECONE_RERANKING" })
    .first();

  await knex("company_configs")
    .where({
      config_template_id: template.uuid_unique,
    })
    .del();

  await knex("configs_templates")
    .where({ 
      key: "PINECONE_RERANKING",
      extension_id: extension.uuid_unique,
    })
    .del();
};
