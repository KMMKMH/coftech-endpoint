const tableName = "extensions";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const descriptions = {
    GOOGLE_CALENDAR: {
      english: "Allows the bot to manage calendar events and appointments.",
      spanish: "Allows the bot to manage calendar events and appointments.",
    },
    YAPPY: {
      english: "Allows to use Yappy payment service",
      spanish: "Allows use of the Yappy payment service",
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
exports.down = function () {};
