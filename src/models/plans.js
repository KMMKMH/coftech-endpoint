const { repoPlans, repoPlansExtensions } = require("../repositories/plans");
const repoUtils = require("../repositories/utils");
const repoExtensions = require("../repositories/extensions");
const { ApiError } = require("../utils/errors/ApiError");
const ErrorCodes = require("../constants/errorCodes");

const savePlans = async (data) => {
  const { planName, description, price, isActive, currencyID } = data;

  const [currencyField] = await repoUtils.getCurrenciesByField({
    uuid_unique: currencyID,
  });

  if (!currencyField) {
    throw ApiError(400, "Invalid currency ID", ErrorCodes.CURRENCY_NOT_FOUND);
  }

  const [planNameField] = await repoPlans.getByField({
    name: planName,
  });

  if (planNameField) {
    throw ApiError(
      400,
      "Plan name already exists",
      ErrorCodes.PLAN_NAME_EXISTS
    );
  }

  return await repoPlans.save({
    name: planName,
    description,
    price,
    is_active: isActive,
    currency_id: currencyID,
  });
};

const listPlans = async (data) => {
  const mappedColumnData = {
    planName: "name",
    isActive: "is_active",
    currencyID: "currency_id",
  };

  const newData = {};

  for (const dataKey in data) {
    if (mappedColumnData[dataKey]) {
      newData[mappedColumnData[dataKey]] = data[dataKey];
    }
  }

  return await repoPlans.getByField(newData);
};

const updatePlans = async (planID, data) => {
  const { currencyID, planName } = data;

  if (currencyID) {
    const [currencyField] = await repoUtils.getCurrenciesByField({
      uuid_unique: currencyID,
    });

    if (!currencyField) {
      throw ApiError(400, "Invalid currency ID", ErrorCodes.CURRENCY_NOT_FOUND);
    }
  }

  if (planName) {
    const [planNameField] = await repoPlans.getByField({
      name: planName,
    });

    if (planNameField) {
      throw ApiError(
        400,
        "Plan name already exists",
        ErrorCodes.PLAN_NAME_EXISTS
      );
    }
  }

  const mappedColumnData = {
    planName: "name",
    description: "description",
    price: "price",
    isActive: "is_active",
    currencyID: "currency_id",
  };

  const newData = {};

  for (const dataKey in data) {
    if (mappedColumnData[dataKey]) {
      newData[mappedColumnData[dataKey]] = data[dataKey];
    }
  }

  return await repoPlans.update({ uuid_unique: planID }, newData);
};

const deletePlans = async (planID) => {
  const [toDeletePlan] = await repoPlans.getByField({
    uuid_unique: planID,
  });

  if (!toDeletePlan) {
    throw ApiError(404, "Plan not found", ErrorCodes.PLAN_NOT_FOUND);
  }

  return await repoPlans.delete({ uuid_unique: planID });
};

const listPlansExtensions = async (data) => {
  const mappedColumnData = {
    planID: "plan_id",
    extensionID: "extension_id",
  };

  const newData = {};

  for (const dataKey in data) {
    if (mappedColumnData[dataKey]) {
      newData[mappedColumnData[dataKey]] = data[dataKey];
    }
  }

  return await repoPlansExtensions.getByField(newData);
};

const deletePlansExtensions = async (planID, extensionID) => {
  const [toDeletePlanExtension] = await repoPlansExtensions.getByField({
    plan_id: planID,
    extension_id: extensionID,
  });

  if (!toDeletePlanExtension) {
    throw ApiError(
      404,
      "Plan extension not found",
      ErrorCodes.PLAN_EXTENSION_NOT_FOUND
    );
  }

  return await repoPlansExtensions.delete({
    uuid_unique: toDeletePlanExtension.uuid_unique,
  });
};

const savePlansExtensions = async (data) => {
  const { planID, extensionID } = data;

  const [planField] = await repoPlans.getByField({
    uuid_unique: planID,
  });

  if (!planField) {
    throw ApiError(404, "Plan not found", ErrorCodes.PLAN_NOT_FOUND);
  }

  const [extensionField] = await repoExtensions.getExtensionByField({
    "extensions.uuid_unique": extensionID,
  });

  if (!extensionField) {
    throw ApiError(404, "Extension not found", ErrorCodes.EXTENSION_NOT_FOUND);
  }

  const [existingPlanExtension] = await repoPlansExtensions.getByField({
    plan_id: planID,
    extension_id: extensionID,
  });

  if (existingPlanExtension) {
    throw ApiError(
      400,
      "Plan extension already exists",
      ErrorCodes.PLAN_EXTENSION_EXISTS
    );
  }

  return await repoPlansExtensions.save({
    plan_id: planID,
    extension_id: extensionID,
  });
};

module.exports = {
  savePlans,
  listPlans,
  updatePlans,
  deletePlans,
  listPlansExtensions,
  deletePlansExtensions,
  savePlansExtensions,
};
