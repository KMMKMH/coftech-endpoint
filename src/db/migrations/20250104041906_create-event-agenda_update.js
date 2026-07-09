/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const companies = await knex('company');

  const [config] = await knex("configs_templates").where({ 
    key: "TIMEZONE",
  });

  for (const company of companies) {
    const [hasConfig] = await knex("company_configs").where({
      company_id: company.uuid_unique,
      config_template_id: config.uuid_unique,
    });
    
    if (!hasConfig) {
      await knex("company_configs").insert({
        company_id: company.uuid_unique,
        config_template_id: config.uuid_unique,
        data: config.data_default,
      });
    }
  }

  await knex.raw(`
    CREATE PROCEDURE UpdateAgendaReserves()
    BEGIN
        DECLARE currentDateTime DATETIME;
        SET currentDateTime = NOW();

        UPDATE agenda_reserves ar
        JOIN agenda_event_types aet ON ar.event_type_id = aet.uuid_unique
        JOIN company_configs cc ON ar.company_id = cc.company_id
        JOIN configs_templates ct ON cc.config_template_id = ct.uuid_unique
        SET ar.status_id = (SELECT uuid_unique FROM agenda_reserves_status WHERE name = 'IN PROGRESS')
        WHERE ar.status_id = (SELECT uuid_unique FROM agenda_reserves_status WHERE name = 'ACTIVE')
        AND ct.key = 'TIMEZONE'
        AND (ar.date <= CONVERT_TZ(currentDateTime, @@session.time_zone, cc.data));

        UPDATE agenda_reserves ar
        JOIN agenda_event_types aet ON ar.event_type_id = aet.uuid_unique
        JOIN company_configs cc ON ar.company_id = cc.company_id
        JOIN configs_templates ct ON cc.config_template_id = ct.uuid_unique
        SET ar.status_id = (SELECT uuid_unique FROM agenda_reserves_status WHERE name = 'COMPLETED')
        WHERE ar.status_id = (SELECT uuid_unique FROM agenda_reserves_status WHERE name = 'IN PROGRESS')
        AND ct.key = 'TIMEZONE'
        AND DATE_ADD(ar.date, INTERVAL aet.duration MINUTE) < CONVERT_TZ(currentDateTime, @@session.time_zone, cc.data);
    END;
  `);

  await knex.raw(`
    CREATE EVENT update_agenda_reserves_status
    ON SCHEDULE EVERY 1 MINUTE
    DO CALL UpdateAgendaReserves();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const [config] = await knex('configs_templates').where({ key: 'TIMEZONE' });
  await knex('company_configs').where({ config_template_id: config.uuid_unique }).del();
  await knex('configs_templates').where({ key: 'TIMEZONE' }).del();

  await knex.raw(`DROP EVENT IF EXISTS update_agenda_reserves_status;`);
  await knex.raw(`DROP PROCEDURE IF EXISTS UpdateAgendaReserves;`);
};
