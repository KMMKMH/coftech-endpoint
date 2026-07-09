/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.raw(
    `CREATE OR REPLACE VIEW v_extensions AS
      SELECT 
        e.id,
        e.uuid_unique,
        e.key,
        e.name,
        e.status,
        e.icon,
        e.description,
        e.category_id,
        ec.name AS category_name,
        ec.unique AS category_unique,
        ec.dynamic AS category_dynamic,
        CASE
          WHEN COUNT(ei.id) = 0 THEN NULL
          ELSE JSON_OBJECT(
              "url", MAX(ei.url),
              "identificator", MAX(ei.identificator),
              "alter_text", MAX(ei.alter_text),
              "is_cover", MAX(ei.is_cover),
              "extension_id", MAX(ei.extension_id)
          )
        END AS extension_image
      FROM extensions e
      LEFT JOIN extensions_categories ec ON ec.uuid_unique = e.category_id
      LEFT JOIN extensions_images ei ON ei.extension_id = e.uuid_unique
      GROUP BY 
        e.id,
        e.uuid_unique,
        e.key, e.name,
        e.status,
        e.icon,
        e.description,
        e.category_id,
        ec.name,
        ec.unique,
        ec.dynamic
    `
  );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw(`DROP VIEW IF EXISTS v_extensions`);
};
