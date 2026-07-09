const { up, down } = require("../../utils/uuid_v4_trigger");
const tableName = "extensions_categories";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.string("uuid_unique").unique().notNullable();
    table.string("name").unique().notNullable();
    table.boolean("unique").defaultTo(true);
    table.boolean("dynamic").defaultTo(false);
    table.timestamps(true, true);
  });

  await knex.raw(up(tableName));

  const categories = [
    { name: "VOICE_IA" },
    { name: "VOICE_TO_TEXT" },
    { name: "DATA", unique: false },
    { name: "CUSTOMER_SUPPORT" },
    { name: "SCREEN_DATA", unique: false, dynamic: true },
    { name: "CALENDAR", unique: false },
    { name: "MASSIVE_NOTIFICATIONS", unique: false },
    { name: "WHATSAPP_FUNCTIONS", unique: false },
    { name: "PAYMENTS", unique: false },
    { name: "DEMOS", unique: false },
    { name: "BOT_UTILITIES", unique: false },
    { name: "DEFAULT", unique: false },
  ];

  await knex(tableName).insert(categories);

  const insertedCategories = await knex(tableName).select(
    "uuid_unique",
    "name"
  );

  const categoriesUUID = insertedCategories.reduce((acc, category) => {
    acc[category.name] = category.uuid_unique;
    return acc;
  }, {});

  const extensions = {
    ELEVENLABS: categoriesUUID.VOICE_IA,
    GPT_SPEECH_TO_SPEECH: categoriesUUID.VOICE_IA,
    SPEECH_TO_TEXT: categoriesUUID.VOICE_TO_TEXT,
    BAGUTA_DATA: categoriesUUID.DATA,
    XETUX: categoriesUUID.DATA,
    NOCODB_SERVICE: categoriesUUID.DATA,
    GLORIA_FOOD: categoriesUUID.DATA,
    CUSTOMER_SUPPORT_WP: categoriesUUID.CUSTOMER_SUPPORT,
    SCREENSHOT_SERVICE: categoriesUUID.CUSTOMER_SUPPORT,
    SCREENSHOT_DATA: categoriesUUID.SCREEN_DATA,
    GOOGLE_CALENDAR: categoriesUUID.CALENDAR,
    CAMPAIGNS: categoriesUUID.MASSIVE_NOTIFICATIONS,
    WHATSAPP_CALL_CONTROL: categoriesUUID.WHATSAPP_FUNCTIONS,
    NMI: categoriesUUID.PAYMENTS,
    YAPPY: categoriesUUID.PAYMENTS,
    PROMPT_PAYMENTS: categoriesUUID.PAYMENTS,
    DEMO_PAYMENTS: categoriesUUID.DEMOS,
    HUMANIZE_RESPONSE: categoriesUUID.BOT_UTILITIES,
    OPEN_AI_SERVICE: categoriesUUID.BOT_UTILITIES,
  };

  await knex("extensions").where("category", "UNCATEGORIZED").update({ category: categoriesUUID.DEFAULT });

  for (const [key, category] of Object.entries(extensions)) {
    await knex("extensions").where({ key }).update({ category });
  }

  await knex.schema.alterTable("extensions", (table) => {
    table.renameColumn("category", "category_id");
    table.foreign("category_id").references("uuid_unique").inTable(tableName)
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable("extensions", (table) => {
    table.dropForeign("category_id");
    table.string("category_id").notNullable().defaultTo("UNCATEGORIZED").alter();
    table.renameColumn("category_id", "category");
  });

  const extensions = {
    ELEVENLABS: "VOICE_IA",
    GPT_SPEECH_TO_SPEECH: "VOICE_IA",
    CUSTOMER_SUPPORT_WP: "CUSTOMER_SUPPORT",
    SCREENSHOT_SERVICE: "CUSTOMER_SUPPORT",
  };

  await knex("extensions").update({ category: "UNCATEGORIZED" });

  for (const [key, category] of Object.entries(extensions)) {
    await knex("extensions").where({ key }).update({ category });
  }

  await knex.raw(down(tableName));
  await knex.schema.dropTable(tableName);
};
