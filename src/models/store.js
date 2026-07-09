const repoStore = require("../repositories/store");
const repoUtils = require("../repositories/utils");
const repoPayments = require("../repositories/payments");
const repoAccount = require("../repositories/accounts");
const repoCompany = require("../repositories/company");
const repoBot = require("../repositories/bots");

const modelPayments = require("../models/payments");

const generateToken = require("../utils/generateRandomToken");
const dayjs = require("dayjs");

const getStoreCategoryList = async (query) => {
  try {
    const { categoryID, parentID } = query;

    const storeCategory = await repoStore.getStoreCategoryByField({
      ...(categoryID && { "store_categories.uuid_unique": categoryID }),
      ...(parentID && { "store_categories.parent_id": parentID }),
    });

    return storeCategory.filter((item) => {
      if (item.parent_name === null) {
        delete item.parent_name;
      }
      return item;
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveStoreCategory = async (data) => {
  try {
    const { name, parentID } = data;

    if (parentID) {
      const [parentCategory] = await repoStore.getStoreCategoryByField({
        "store_categories.uuid_unique": parentID,
      });
      if (!parentCategory) {
        throw new Error(`Parent category ID ${parentID} does not exist`);
      }
    }

    const [storeCategoryField] = await repoStore.getStoreCategoryByField({
      "store_categories.name": name,
      ...(parentID && { "store_categories.parent_id": parentID }),
    });
    if (storeCategoryField) {
      throw new Error(`Store category with name ${name} already exists`);
    }

    const dataToSave = {
      "store_categories.name": name,
      ...(parentID && { "store_categories.parent_id": parentID }),
    };

    return await repoStore.saveStoreCategory(dataToSave);
  } catch (error) {
    throw new Error(error);
  }
};

const updateStoreCategory = async (query, data) => {
  try {
    const { categoryID } = query;
    const { parentID } = data;

    const [currentCategory] = await repoStore.getStoreCategoryByField({
      "store_categories.uuid_unique": categoryID,
    });

    if (!currentCategory) {
      throw new Error(`Category ID ${categoryID} does not exist`);
    }

    if (parentID) {
      const [parentCategory] = await repoStore.getStoreCategoryByField({
        "store_categories.uuid_unique": parentID,
      });
      if (!parentCategory) {
        throw new Error(`Parent category ID ${parentID} does not exist`);
      }
    }

    if (parentID === categoryID) {
      throw new Error(
        `Parent category cannot be the same as the category ID: ${parentID}`
      );
    }

    const fieldsToUpdate = ["name", "parent_id"];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      const dataField = field === "parent_id" ? "parentID" : field;
      if (
        data[dataField] !== undefined &&
        data[field] !== currentCategory[field]
      ) {
        dataUpdate[field] = data[dataField];
      }
    });

    if (Object.keys(dataUpdate).length > 0) {
      const whereToUpdate = {
        "store_categories.uuid_unique": categoryID,
      };

      return await repoStore.updateStoreCategory(whereToUpdate, dataUpdate);
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteStoreCategory = async (query) => {
  try {
    const { categoryID } = query;

    const [currentCategory] = await repoStore.getStoreCategoryByField({
      "store_categories.uuid_unique": categoryID,
    });

    if (!currentCategory) {
      throw new Error(`Category ID ${categoryID} does not exist`);
    }

    return await repoStore.deleteStoreCategory({
      "store_categories.uuid_unique": categoryID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getStoreItemsList = async (query) => {
  try {
    const { categoryID, itemID } = query;

    return await repoStore.getStoreItemsByField({
      ...(categoryID && { "store_items.category_id": categoryID }),
      ...(itemID && { "store_items.uuid_unique": itemID }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveStoreItem = async (body, files) => {
  try {
    const {
      name,
      description,
      amount,
      currencyID,
      categoryID,
      typeID,
      is_periodic,
    } = body;

    const images = files.map((file) => file.buffer.toString("base64"));

    const [categoryField] = await repoStore.getStoreCategoryByField({
      "store_categories.uuid_unique": categoryID,
    });
    if (!categoryField) {
      throw new Error(`Category ID ${categoryID} does not exist`);
    }

    const [typeField] = await repoStore.getStoreTypeByField({
      "store_types.uuid_unique": typeID,
    });
    if (!typeField) {
      throw new Error(`Type ID ${typeID} does not exist`);
    }

    const [currencyField] = await repoUtils.getCurrenciesByField({
      "currencies.uuid_unique": currencyID,
    });
    if (!currencyField) {
      throw new Error(`Currency ID ${currencyID} does not exist`);
    }

    const [storeItemField] = await repoStore.getStoreItemsByField({
      "store_items.name": name,
      "store_items.category_id": categoryID,
      "store_items.type_id": typeID,
    });
    if (storeItemField) {
      throw new Error(`Store item with name ${name} already exists`);
    }

    const uniqueSku = await getUniqueSKU();

    const formattedAmount = parseFloat(amount).toFixed(2);

    const isPeriodic = is_periodic === "true" ? true : false;

    const dataToSave = {
      "store_items.name": name,
      "store_items.description": description,
      "store_items.amount": formattedAmount,
      "store_items.currency_id": currencyID,
      "store_items.images": JSON.stringify(images),
      "store_items.category_id": categoryID,
      "store_items.type_id": typeID,
      "store_items.sku": uniqueSku,
      ...(isPeriodic && { "store_items.is_periodic": isPeriodic }),
    };

    return await repoStore.saveStoreItem(dataToSave);
  } catch (error) {
    throw new Error(error);
  }
};

const updateStoreItem = async (query, data) => {
  try {
    const { itemID } = query;
    const { categoryID, typeID, currencyID, is_periodic, images } = data;

    const [currentItem] = await repoStore.getStoreItemsByField({
      "store_items.uuid_unique": itemID,
    });

    if (!currentItem) {
      throw new Error(`Item ID ${itemID} does not exist`);
    }

    const [categoryField] = await repoStore.getStoreCategoryByField({
      "store_categories.uuid_unique": categoryID,
    });
    if (!categoryField) {
      throw new Error(`Category ID ${categoryID} does not exist`);
    }

    const [typeField] = await repoStore.getStoreTypeByField({
      "store_types.uuid_unique": typeID,
    });
    if (!typeField) {
      throw new Error(`Type ID ${typeID} does not exist`);
    }

    const [currencyField] = await repoUtils.getCurrenciesByField({
      "currencies.uuid_unique": currencyID,
    });
    if (!currencyField) {
      throw new Error(`Currency ID ${currencyID} does not exist`);
    }

    const fieldsToUpdate = [
      "name",
      "description",
      "amount",
      "currency_id",
      "category_id",
      "type_id",
    ];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      const dataField =
        {
          currency_id: "currencyID",
          category_id: "categoryID",
          type_id: "typeID",
        }[field] || field;
      if (
        data[dataField] !== undefined &&
        data[dataField] !== currentItem[field]
      ) {
        dataUpdate[field] = data[dataField];
      }
    });

    if (is_periodic !== undefined && is_periodic !== currentItem.is_periodic) {
      dataUpdate.is_periodic = is_periodic === "true" ? true : false;
    }

    if (images.length > 0) {
      dataUpdate.images = JSON.stringify(
        images.map((file) => file.buffer.toString("base64"))
      );
    }

    if (Object.keys(dataUpdate).length > 0) {
      const whereToUpdate = {
        "store_items.uuid_unique": itemID,
      };
      console.log(dataUpdate);

      return await repoStore.updateStoreItem(whereToUpdate, dataUpdate);
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteStoreItem = async (query) => {
  try {
    const { itemID } = query;

    const [currentItem] = await repoStore.getStoreItemsByField({
      "store_items.uuid_unique": itemID,
    });

    if (!currentItem) {
      throw new Error(`Item ID ${itemID} does not exist`);
    }

    return await repoStore.deleteStoreItem({
      "store_items.uuid_unique": itemID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getUniqueSKU = async () => {
  try {
    let isUniqueToken = false;
    let uniqueToken = "";
    while (!isUniqueToken) {
      uniqueToken = generateToken(8);
      const [storeItemField] = await repoStore.getStoreItemsByField({
        "store_items.sku": uniqueToken,
      });
      if (!storeItemField) {
        isUniqueToken = true;
      }
    }
    return uniqueToken.toUpperCase();
  } catch (error) {
    throw new Error(error);
  }
};

const generateUrlItem = async (query) => {
  try {
    const { itemID, user, botID } = query;

    const [accountField] = await repoAccount.getAccountByField({
      "accounts.uuid_unique": user,
    });
    if (!accountField) {
      throw new Error(`User ${user} does not exist`);
    }

    const [currentItem] = await repoStore.getStoreItemsByField({
      "store_items.uuid_unique": itemID,
    });

    if (!currentItem) {
      throw new Error(`Item ID ${itemID} does not exist`);
    }

    if (currentItem.type_name === "BOT" && !botID) {
      throw new Error(`Bot ID is required for this item ${itemID}`);
    }

    const [paymentProviderField] =
      await repoPayments.getPaymentsProviderByField({
        "payments_provider.name": "NMI",
      });
    if (!paymentProviderField) {
      throw new Error(`Payment provider not found.`);
    }

    if (botID) {
      const [botField] = await repoBot.getBotByField({
        "bots.uuid_unique": botID,
      });
      if (!botField) {
        throw new Error(`Bot ID ${botID} does not exist`);
      }
    }

    let { amount, is_periodic, currency_id: currencyID } = currentItem;
    amount = parseFloat(amount).toFixed(2);

    const { company_id: companyID, phone } = accountField;

    const { uuid_unique: providerID } = paymentProviderField;

    const queryToSend = { companyID };
    const bodyToSend = {
      phone,
      amount,
      currencyID,
      transaction_type: is_periodic ? "subscription" : "sale",
      products_list: [{ name: currentItem.name, price: amount, quantity: 1 }],
      providerID,
      metadata: {
        store_item_details: { itemID, userID: user, ...(botID ? botID : null) },
      },
    };
    const urlOptions = {
      time: 1440,
      attempts: 0,
    };
    const { url } = await modelPayments.generatePaymentToken(
      queryToSend,
      bodyToSend,
      urlOptions
    );

    return url;
  } catch (error) {
    throw new Error(error);
  }
};
const getStoreLogsList = async (query) => {
  try {
    const { storeID, companyID, botID } = query;

    if (storeID) {
      const [storeItem] = await repoStore.getStoreItemsByField({
        "store_items.uuid_unique": storeID,
      });
      if (!storeItem) {
        throw new Error(`Store item ID ${storeID} does not exist`);
      }
    } else if (companyID) {
      const [companyField] = await repoCompany.getCompanyByField({
        "company.uuid_unique": companyID,
      });
      if (!companyField) {
        throw new Error(`Company ID ${companyID} does not exist`);
      }
    } else if (botID) {
      const [botField] = await repoBot.getBotsByField({
        "bots.uuid_unique": botID,
      });
      if (!botField) {
        throw new Error(`Bot ID ${botID} does not exist`);
      }
    }

    return await repoStore.getStoreLogsByField({
      ...(storeID && { "store_logs.store_item_id": storeID }),
      ...(companyID && { "store_logs.company_id": companyID }),
      ...(botID && { "store_logs.bot_id": botID }),
    });
  } catch (error) {
    throw new Error(error);
  }
};

const saveStoreLog = async (query, body) => {
  try {
    const { storeID, companyID, botID } = query;

    const [storeItem] = await repoStore.getStoreItemsByField({
      "store_items.uuid_unique": storeID,
    });
    if (!storeItem) {
      throw new Error(`Store item ID ${storeID} does not exist`);
    }

    if (storeItem.type_name === "BOT" && !botID) {
      throw new Error(`Bot ID is required for this item ${storeID}`);
    }

    if (storeItem.type_name === "COMPANY" && !companyID) {
      throw new Error(`Company ID is required for this item ${storeID}`);
    }

    if (companyID) {
      const [companyField] = await repoCompany.getCompanyByField({
        "company.uuid_unique": companyID,
      });
      if (!companyField) {
        throw new Error(`Company ID ${companyID} does not exist`);
      }
    }

    if (botID) {
      const [botField] = await repoBot.getBotsByField({
        "bots.uuid_unique": botID,
      });
      if (!botField) {
        throw new Error(`Bot ID ${botID} does not exist`);
      }
    }

    const [storeLogField] = await repoStore.getStoreLogsByField({
      "store_logs.store_item_id": storeID,
      ...(companyID && { "store_logs.company_id": companyID }),
      ...(botID && { "store_logs.bot_id": botID }),
    });
    if (storeLogField) {
      throw new Error(`Store log already exists`);
    }
    const { purchase_date, activation_date, renewal_date, status } = body;

    const dataToSave = {
      "store_logs.store_item_id": storeID,
      ...(companyID && { "store_logs.company_id": companyID }),
      ...(botID && { "store_logs.bot_id": botID }),
      "store_logs.purchase_date": dayjs(purchase_date),
      "store_logs.activation_date": activation_date
        ? dayjs(activation_date)
        : null,
      "store_logs.renewal_date": renewal_date ? dayjs(renewal_date) : null,
      "store_logs.status": status,
    };

    return await repoStore.saveStoreLog(dataToSave);
  } catch (error) {
    throw new Error(error);
  }
};

const updateStoreLog = async (query, data) => {
  try {
    const { logID } = query;

    const [logField] = await repoStore.getStoreLogsByField({
      "store_logs.uuid_unique": logID,
    });
    if (!logField) {
      throw new Error(`Log ID ${logID} does not exist`);
    }

    const fieldsToUpdate = [
      "status",
      "purchase_date",
      "activation_date",
      "renewal_date",
    ];

    let dataUpdate = {};

    fieldsToUpdate.forEach((field) => {
      if (data[field] != undefined && data[field] !== logField[field]) {
        dataUpdate[field] = data[field];
      }
    });

    if (Object.keys(fieldsToUpdate) > 0) {
      const whereToUpdate = {
        "store_logs.uuid_unique": logID,
      };
      return await repoStore.updateStoreLog(whereToUpdate, dataUpdate);
    } else {
      return true;
    }
  } catch (error) {
    throw new Error(error);
  }
};

const deleteStoreLog = async (query) => {
  try {
    const { logID } = query;

    const [logField] = await repoStore.getStoreLogsByField({
      "store_logs.uuid_unique": logID,
    });
    if (!logField) {
      throw new Error(`Log ID ${logID} does not exist`);
    }

    return await repoStore.deleteStoreLog({
      "store_logs.uuid_unique": logID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  getStoreCategoryList,
  saveStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  getStoreItemsList,
  saveStoreItem,
  updateStoreItem,
  deleteStoreItem,
  generateUrlItem,
  getStoreLogsList,
  saveStoreLog,
  updateStoreLog,
  deleteStoreLog,
};
