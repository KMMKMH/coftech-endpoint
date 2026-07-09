const { createS3Bucket, formatBucketName } = require("../../utils/s3Service");
const tableName = "storage_company";
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  if (process.env.ENVIRONMENT == "production") {  
    const companies = await knex("company");

    const quota = 1024 * 1024 * 1024;
    for (const company of companies) {
      const [hasStorage] = await knex(tableName)
        .where({ company_id: company.uuid_unique })
        .select("company_id");

      if (hasStorage) {
        continue;
      }

      const [storageID] = await knex(tableName).insert({
        company_id: company.uuid_unique,
        quota,
        available_space: quota,
      });
      const [storageField] = await knex(tableName)
        .where({ id: storageID })
        .select("uuid_unique");

      const [hasBucket] = await knex("storage_buckets")
        .where({ company_id: company.uuid_unique })
        .select("company_id");

      if (!hasBucket) {
        const bucketName = formatBucketName(company.name, company.uuid_unique);

        await Promise.all([
          knex("storage_buckets").insert({
            company_id: company.uuid_unique,
            storage_id: storageField.uuid_unique,
            bucket_name: bucketName,
          }),
          createS3Bucket(bucketName),
        ]);
      }
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function() {};
