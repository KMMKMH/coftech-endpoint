const { createS3Bucket, formatBucketName } = require("../utils/s3Service");
const repoCompany = require("../repositories/company");
const {
  repoStorage,
  repoStorageLogs,
  repoStorageBuckets,
} = require("../repositories/storage");
const ErrorCodes = require("../constants/errorCodes");
const { ApiError } = require("../utils/errors/ApiError");
const logger = require("../utils/logger");

const saveStorage = async (query, body) => {
  const { companyID } = query;
  const { quota } = body;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(
      404,
      `Company with id ${companyID} not found`,
      ErrorCodes.COMPANY_NOT_FOUND
    );
  }

  const [storageField] = await repoStorage.getByField({
    "storage_company.company_id": companyID,
  });

  if (storageField) {
    throw ApiError(
      409,
      `Storage for company_id ${companyID} already exists.`,
      ErrorCodes.STORAGE_ALREADY_EXISTS
    );
  }

  const storageData = {
    company_id: companyID,
    quota,
    available_space: quota,
  };

  const storage = await repoStorage.save(storageData);
  const bucketName = formatBucketName(companyField.name, companyID);

  try {
    const [[res]] = await Promise.all([
      repoStorageBuckets.save({
        company_id: companyID,
        storage_id: storage.uuid_unique,
        bucket_name: bucketName,
      }),
      createS3Bucket(bucketName),
    ]);
    return res;
  } catch (error) {
    await repoStorageBuckets.delete({ "storage_buckets.storage_id": storage.uuid_unique });
    await repoStorage.delete({ "storage_company.uuid_unique": storage.uuid_unique });

    logger.error(`Error creating S3 resources: ${error.message}`);
    throw ApiError(
      500,
      `Failed to create storage`,
      ErrorCodes.STORAGE_BUCKET_CREATION_FAILED
    );
  }
};

const deleteStorage = async (query) => {
  const { companyID, storageID } = query;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });

  if (!companyField) {
    throw ApiError(
      404,
      `Company with id ${companyID} not found`,
      ErrorCodes.COMPANY_NOT_FOUND
    );
  }

  const [storageField] = await repoStorage.getByField({
    "storage_company.uuid_unique": storageID,
  });

  if (!storageField) {
    throw ApiError(
      404,
      `Storage with id ${storageID} not found`,
      ErrorCodes.STORAGE_NOT_FOUND
    );
  }

  const [storageBucketField] = await repoStorageBuckets.getByField({
    "storage_buckets.storage_id": storageID,
  });
  if (storageBucketField) {
    await repoStorageBuckets.delete({
      "storage_buckets.storage_id": storageID,
    });
  }

  return await repoStorage.delete({
    "storage_company.uuid_unique": storageID,
  });
};

const updateStorage = async (query, body) => {
  const { companyID, storageID } = query;

  const [companyField] = await repoCompany.getCompanyByField({
    "company.uuid_unique": companyID,
  });
  if (!companyField) {
    throw ApiError(
      404,
      `Company with id ${companyID} not found`,
      ErrorCodes.COMPANY_NOT_FOUND
    );
  }

  const [storageField] = await repoStorage.getByField({
    "storage_company.uuid_unique": storageID,
  });
  if (!storageField) {
    throw ApiError(
      404,
      `Storage with id ${storageID} not found`,
      ErrorCodes.STORAGE_NOT_FOUND
    );
  }

  const dontUpdateFields = [
    "id",
    "uuid_unique",
    "created_at",
    "updated_at",
    "available_space",
  ];

  const filteredData = Object.fromEntries(
    Object.entries(body).filter(([key]) => !dontUpdateFields.includes(key))
  );

  if (Object.keys(filteredData).length === 0) {
    return false;
  }

  if (filteredData.quota !== undefined) {
    const currentQuota = storageField.quota;
    const newQuota = filteredData.quota;

    const usedSpace = currentQuota - storageField.available_space;

    if (newQuota < usedSpace) {
      throw ApiError(
        400,
        `Invalid downgrade: The new quota is less than the currently used space.`,
        ErrorCodes.STORAGE_INVALID_QUOTA
      );
    }

    const newAvailableSpace =
      newQuota >= usedSpace
        ? newQuota - usedSpace
        : storageField.available_space;

    filteredData.available_space = newAvailableSpace;
  }

  const where = {
    "storage_company.uuid_unique": storageID,
  };

  return await repoStorage.update(where, filteredData);
};

const saveStorageLogs = async (logInfo) => {
  return await repoStorageLogs.save(logInfo);
};

const deleteStorageLogs = async (whereData) => {
  const { storageLogID } = whereData;

  const [storageLogsField] = await repoStorageLogs.getByField({
    "storage_logs.uuid_unique": storageLogID,
  });

  if (!storageLogsField) {
    throw ApiError(
      404,
      `Storage Logs with id ${storageLogID} not found`,
      ErrorCodes.STORAGE_LOG_NOT_FOUND
    );
  }

  return await repoStorageLogs.delete({
    "storage_logs.uuid_unique": storageLogID,
  });
};

const updateStorageLogs = async (query, data) => {
  const { storageLogID } = query;

  const [storageLogsField] = await repoStorageLogs.getByField({
    "storage_logs.uuid_unique": storageLogID,
  });

  if (!storageLogsField) {
    throw ApiError(
      404,
      `Storage logs with id ${storageLogID} not found`,
      ErrorCodes.STORAGE_LOG_NOT_FOUND
    );
  }

  const dontUpdateFields = ["id", "uuid_unique", "created_at", "updated_at"];

  const filteredData = Object.fromEntries(
    Object.entries(data).filter(([key]) => !dontUpdateFields.includes(key))
  );

  if (Object.keys(filteredData).length === 0) {
    return false;
  }

  const where = {
    "storage_logs.uuid_unique": storageLogID,
  };

  return await repoStorageLogs.update(where, filteredData);
};

const checkAndUpdateSpace = async (companyID, fileSize) => {
  const [storageField] = await repoStorage.getByField({
    "storage_company.company_id": companyID,
  });

  if (!storageField) {
    throw ApiError(
      404,
      `Storage for company ${companyID} not found`,
      ErrorCodes.STORAGE_NOT_FOUND
    );
  }

  const { available_space } = storageField;

  if (available_space >= fileSize) {
    const remainingSpace = available_space - fileSize;
    const data = { available_space: remainingSpace };
    const updateWhere = { "storage_company.company_id": companyID };
    await repoStorage.update(updateWhere, data);

    return {
      status: true,
      available_space: remainingSpace,
      previousSpace: available_space,
    };
  } else {
    return {
      status: false,
      available_space,
    };
  }
};

const realeaseSpace = async (companyID, fileSize) => {
  const [storageField] = await repoStorage.getByField({
    "storage_company.company_id": companyID,
  });

  if (!storageField) {
    throw ApiError(
      404,
      `Storage for company ${companyID} not found`,
      ErrorCodes.STORAGE_NOT_FOUND
    );
  }

  const { available_space } = storageField;

  const newAvailableSpace = available_space + fileSize;

  const updateWhere = { "storage_company.company_id": companyID };
  const dataToUpdate = { available_space: newAvailableSpace };
  await repoStorage.update(updateWhere, dataToUpdate);

  return {
    status: true,
    available_space: newAvailableSpace,
  };
};

module.exports = {
  saveStorage,
  updateStorage,
  deleteStorage,
  saveStorageLogs,
  deleteStorageLogs,
  updateStorageLogs,
  checkAndUpdateSpace,
  realeaseSpace,
};