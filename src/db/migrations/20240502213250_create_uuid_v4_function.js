/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.raw(`
    CREATE FUNCTION uuid_v4() RETURNS CHAR(36)
    READS SQL DATA
    BEGIN
        SET @g1 = HEX(RANDOM_BYTES(4));
        SET @g2 = HEX(RANDOM_BYTES(2));
        SET @g3 = CONCAT('4', SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3));
        SET @g4 = CONCAT(HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64) + 8), SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3));
        SET @g5 = HEX(RANDOM_BYTES(6));
    
        RETURN LOWER(CONCAT(@g1, '-', @g2, '-', @g3, '-', @g4, '-', @g5));
    END;
  `);
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = function (knex) {
  return knex.raw(`
    DROP FUNCTION IF EXISTS uuid_v4;
  `);
};
