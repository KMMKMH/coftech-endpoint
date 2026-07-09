const tableName = "extensions";
const extensionKey = "CAMPAIGNS";

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex(tableName)
    .where({ key: extensionKey })
    .update({
      description: JSON.stringify({
        english: "Allows the robot to notify contacts in bulk about an event.",
        spanish:
          "Permite al robot notificar masivamente a los contactos sobre un evento.",
      }),
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex(tableName)
    .where({ key: extensionKey })
    .update({
      description: JSON.stringify({
        english: "Enables the bot to send bulk campaign messages.",
        spanish: "Habilita el bot para enviar mensajes de campaña por lotes.",
      }),
    });
};
