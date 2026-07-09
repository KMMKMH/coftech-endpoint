const createUpdatedAtTrigger = (tableName) => {
  return `
    CREATE TRIGGER ${tableName}_before_update_updated_at
    BEFORE UPDATE ON ${tableName} FOR EACH ROW
    BEGIN
      SET NEW.updated_at = NOW();
    END;
  `;
};

const dropUpdatedAtTrigger = (tableName) => {
  return `DROP TRIGGER IF EXISTS ${tableName}_before_update_updated_at;`;
};

module.exports = {
  createUpdatedAtTrigger,
  dropUpdatedAtTrigger,
};
