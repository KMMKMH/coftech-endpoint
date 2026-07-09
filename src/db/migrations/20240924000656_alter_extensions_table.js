const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.json("description");
  });

  const descriptions = {
    SCREENSHOT_SERVICE: {
      english: "Allows the bot to take screenshots.",
      spanish: "Allows the bot to take screenshots.",
    },
    OPEN_AI_SERVICE: {
      english: "Allows the bot to generate text using OpenAI.",
      spanish: "Allows the bot to generate text using OpenAI.",
    },
    HUMANIZE_RESPONSE: {
      english: "Bot simulates typing times like a human.",
      spanish: "Bot simulates typing times like a human.",
    },
    SPEECH_TO_TEXT: {
      english: "Bot can convert voice messages into text.",
      spanish: "Bot can convert voice messages into text.",
    },
    XETUX: {
      english: "Can handle invoices with Xetux.",
      spanish: "Can handle invoices with Xetux.",
    },
    GPT_SPEECH_TO_SPEECH: {
      english: "Bot can answer voice messages with voice using GPT.",
      spanish: "Bot can answer voice messages with voice using GPT.",
    },
    NOCODB_SERVICE: {
      english: "Bot can handle database queries with NocoDB.",
      spanish: "Bot can handle database queries with NocoDB.",
    },
    GLORIA_FOOD: {
      english: "Bot can search the restaurant menu with Gloria Food.",
      spanish: "Bot can search the restaurant menu with Gloria Food.",
    },
    ELEVENLABS: {
      english: "Bot can answer voice messages with voice using ElevenLabs.",
      spanish: "Bot can answer voice messages with voice using ElevenLabs.",
    },
    SCREENSHOT_DATA: {
      english: "Bot sends a screenshot with orders data",
      spanish: "Bot sends a screenshot with orders data",
    },
    NMI: {
      english: "Allows to use NMI payment service",
      spanish: "Allows to use NMI payment service",
    },
  };

  for (const [key, value] of Object.entries(descriptions)) {
    await knex(tableName)
      .where({ key })
      .update({ description: JSON.stringify(value) });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn("description");
  });
};
