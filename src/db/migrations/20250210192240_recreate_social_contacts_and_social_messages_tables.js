const { up, down } = require("../../utils/uuid_v4_trigger");
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(`DROP TRIGGER IF EXISTS social_contacts_before_insert_uuid`);

  await knex.schema.createTable("social_contacts", (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("contact_id").notNullable().unique();
    table.string("network_id").notNullable();
    table.string("extra1");
    table.string("extra2");
    table.string("extra3");
    table.text("picture", "longtext");
    table.json("metadata");
    table.timestamps(true, true);
  });

  await knex.raw(up("social_contacts"));

  await knex.raw(`
    ALTER TABLE social_contacts
    ADD CONSTRAINT fk_social_contacts_network_id FOREIGN KEY (network_id) REFERENCES social_networks(uuid_unique)
  `);

  await knex.raw(`DROP TRIGGER IF EXISTS social_messages_before_insert_uuid`);

  await knex.schema.createTable("social_messages", (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("network_id").notNullable();
    table.string("message_id");
    table.boolean("is_group").defaultTo(true);
    table.boolean("is_broadcast").defaultTo(false);
    table.text("body", "longtext").notNullable();
    table.text("data", "longtext");
    table.string("type").defaultTo("text");
    table.string("sender");
    table.string("via").defaultTo("receive");
    table.string("to_send");
    table.string("author");
    table.text("extra1", "longtext");
    table.text("extra2", "longtext");
    table.text("extra3", "longtext");
    table.string("client_id").notNullable();
    table.string("category").notNullable().defaultTo("No Clasificado");
    table.timestamps(true, true);
  });

  await knex.raw(up("social_messages"));

  await knex.raw(`
    ALTER TABLE social_messages
    ADD CONSTRAINT fk_social_messages_company_id FOREIGN KEY (company_id) REFERENCES company(uuid_unique),
    ADD CONSTRAINT fk_social_messages_network_id FOREIGN KEY (network_id) REFERENCES social_networks(uuid_unique),
    ADD CONSTRAINT fk_social_messages_client_id FOREIGN KEY (client_id) REFERENCES bots(uuid_unique);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(down("social_messages"));
  await knex.schema.dropTable("social_messages");

  await knex.raw(down("social_contacts"));
  return knex.schema.dropTable("social_contacts");
};
