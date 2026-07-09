const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "extensions";
const usagesTableName = "completions_usages";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const [speechToTeTextField] = await knex(tableName).where({
    key: "SPEECH_TO_TEXT",
  });
  const [gptTextToSpeechField] = await knex(tableName).where({
    key: "GPT_SPEECH_TO_SPEECH",
  });

  await knex("configs_templates").insert([
    {
      owner_type: "extension",
      key: "SPEECH_TO_TEXT_OPENAI_KEY",
      data_default: "",
      data_type: "string",
      description: "OpenAI key for converting speech to text",
      extension_id: speechToTeTextField.uuid_unique,
    },
    {
      owner_type: "extension",
      key: "GPT_SPEECH_TO_SPEECH_OPENAI_KEY",
      data_default: "",
      data_type: "string",
      description: "OpenAI key for converting text to speech",
      extension_id: gptTextToSpeechField.uuid_unique,
    },
  ]);

  await knex.schema.alterTable("configs_templates", function(table) {
    table
      .enum("data_type", [
        "string",
        "integer",
        "boolean",
        "enum",
        "float",
        "time",
        "cron",
        "string_commas",
        "json",
        "json_array",
        "array",
      ])
      .notNullable()
      .alter();
  });

  await knex("extensions_categories").insert({
    name: "BRAIN",
    unique: true,
    dynamic: false,
  });

  const [category] = await knex("extensions_categories").where({
    name: "BRAIN",
  });

  await knex(tableName).insert({
    key: "BRAIN",
    name: "Bot Brain",
    icon: "FaBrain",
    description: JSON.stringify({
      english: "The artificial intelligence of your bot",
      spanish: "La inteligencia artificial de tu bot",
    }),
    category_id: category.uuid_unique,
  });
  
  const [extension] = await knex(tableName).where({ key: "BRAIN" });

  await knex("configs_templates").insert([
    {
      owner_type: "extension",
      key: "BRAIN_OPENROUTER_KEY",
      data_default: "",
      data_type: "string",
      description: "Open Router api key",
      extension_id: extension.uuid_unique,
    },
    {
      owner_type: "extension",
      key: "BRAIN_OPENROUTER_MODEL",
      data_default: "",
      data_type: "string",
      description: "AI model to be used for the bot",
      extension_id: extension.uuid_unique,
    },
    {
      owner_type: "extension",
      key: "BRAIN_OPENROUTER_ALTERNATIVE_MODELS",
      data_default: JSON.stringify([
        "openai/gpt-4o-mini",
        "google/gemini-2.0-flash-001",
        "deepseek/deepseek-r1",
      ]),
      data_type: "array",
      description: "Models to be used in case of failure of the main model",
      extension_id: extension.uuid_unique,
    },
    {
      owner_type: "extension",
      key: "BRAIN_OPENROUTER_USE_AUTO_ROUTER",
      data_default: false,
      data_type: "boolean",
      description:
        "Enables the automatic router to select the best model automatically. This disables manual model selection",
      extension_id: extension.uuid_unique,
    },
  ]);

  await knex.schema.createTable(usagesTableName, function(table) {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("bot_id").notNullable();
    table.integer("tokens").notNullable();
    table.decimal("credits", 12, 8).notNullable();
    table.json("metadata").notNullable();
    table.date("date").notNullable();
  });

  await knex.raw(up(usagesTableName));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const configKeys = [
    "SPEECH_TO_TEXT_OPENAI_KEY",
    "GPT_SPEECH_TO_SPEECH_OPENAI_KEY",
    "BRAIN_OPENROUTER_KEY",
    "BRAIN_OPENROUTER_MODEL",
    "BRAIN_OPENROUTER_ALTERNATIVE_MODELS",
    "BRAIN_OPENROUTER_USE_AUTO_ROUTER",
  ];

  const configsToDelete = await knex("configs_templates").whereIn(
    "key",
    configKeys
  );
  const configIds = configsToDelete.map((config) => config.uuid_unique);

  await knex("company_configs").whereIn("config_template_id", configIds).del();

  await knex("configs_templates").whereIn("key", configKeys).del();

  await knex.schema.alterTable("configs_templates", function (table) {
    table
      .enum("data_type", [
        "string",
        "integer",
        "boolean",
        "enum",
        "float",
        "time",
        "cron",
        "string_commas",
        "json",
        "json_array",
      ])
      .notNullable()
      .alter();
  });

  const [extension] = await knex(tableName).where({ key: "BRAIN" });
  if (extension) {
    await knex("bots_extensions")
      .where({ extension: extension.uuid_unique })
      .del();
    await knex(tableName).where({ uuid_unique: extension.uuid_unique }).del();
  }

  const [category] = await knex("extensions_categories").where({
    name: "BRAIN",
  });
  if (category) {
    await knex("extensions_categories")
      .where({ uuid_unique: category.uuid_unique })
      .del();
  }

  await knex.raw(down(usagesTableName));
  await knex.schema.dropTable(usagesTableName);
};
