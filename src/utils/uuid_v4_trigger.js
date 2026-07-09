const up = (table) => {
  return `
    CREATE TRIGGER ${table}_before_insert_uuid BEFORE INSERT ON ${table} FOR EACH ROW
    BEGIN
      SET NEW.uuid_unique = uuid_v4();
    END;
  `;
};

const down = (table) => {
  return `DROP TRIGGER IF EXISTS ${table}_before_insert_uuid;`;
};

module.exports = {
  up,
  down,
};
