const { up, down } = require("../../utils/uuid_v4_trigger");
const { formatBucketName } = require("../../utils/s3Service");
const tableName = 'storage_buckets';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable(tableName, (table) => {
    table.specificType("id", "int(11) NOT NULL AUTO_INCREMENT").primary();
    table.string("uuid_unique").unique().notNullable();
    table.string("company_id").notNullable();
    table.string("storage_id").notNullable();
    table.string('bucket_name').notNullable().unique();
    table.timestamps(true, true);

    table.foreign('company_id').references('uuid_unique').inTable('company');
    table.foreign('storage_id').references('uuid_unique').inTable('storage_company');
  });

  await knex.raw(up(tableName));

  const companies = await knex('storage_company').select('company_id');
  for (const company of companies) {
    const [companyField] = await knex('company').where({ uuid_unique: company.company_id });
    const [storageField] = await knex('storage_company').where({ company_id: company.company_id });
    
    await knex(tableName).insert({
      company_id: companyField.uuid_unique,
      storage_id: storageField.uuid_unique,
      bucket_name: formatBucketName(companyField.name, companyField.uuid_unique),
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw(down(tableName));
  return knex.schema.dropTable(tableName);
};
