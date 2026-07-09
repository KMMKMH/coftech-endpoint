const db = require("../utils/db");
const logger = require("../utils/logger");

const getStoreCategoryByField = async (data, isRaw = false) => {
  try {
    const query = db("store_categories")
      .select("store_categories.*")
      .select("parent.name AS parent_name")
      .leftJoin(
        "store_categories AS parent",
        "store_categories.parent_id",
        "parent.uuid_unique"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (e) {
    logger.error(
      `Error getting store_categories with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting store_categories data`);
  }
};

const saveStoreCategory = async (data) => {
  try {
    logger.info(`saveStoreCategory with data: ${JSON.stringify(data)}`);
    const [storeCategoryID] = await db("store_categories").insert(data);
    return await getStoreCategoryByField({
      "store_categories.id": storeCategoryID,
    });
  } catch (e) {
    logger.error(
      `Error saving store_categories with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving store_categories: ${e}`);
  }
};

const updateStoreCategory = async (where, data) => {
  try {
    logger.info(
      `updateStoreCategory where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("store_categories").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating store_categories with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating store_categories: ${error}`);
  }
};

const deleteStoreCategory = async (where) => {
  try {
    logger.info(`deleteStoreCategory where: ${JSON.stringify(where)}`);
    return await db("store_categories").where(where).delete();
  } catch (error) {
    logger.error(
      `Error deleting store_categories with data: ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error deleting store_categories: ${error}`);
  }
};

const getStoreItemsByField = async (data, isRaw = false) => {
  try {
    const query = db("store_items")
      .select("store_items.*")
      .select("currencies.name AS currency_name")
      .select("currencies.symbol AS currency_symbol")
      .select("currencies.code AS currency_code")
      .select("store_categories.name AS category_name")
      .select("store_types.key AS type_name")
      .leftJoin(
        "currencies",
        "store_items.currency_id",
        "currencies.uuid_unique"
      )
      .leftJoin(
        "store_categories",
        "store_items.category_id",
        "store_categories.uuid_unique"
      )
      .leftJoin(
        "store_types",
        "store_items.type_id",
        "store_types.uuid_unique"
      );

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting store_items with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting store_items data`);
  }
};

const saveStoreItem = async (data) => {
  try {
    logger.info(`saveStoreItem with data: ${JSON.stringify(data)}`);
    const [storeItemID] = await db("store_items").insert(data);
    return await getStoreItemsByField({
      "store_items.id": storeItemID,
    });
  } catch (error) {
    logger.error(
      `Error saving store_items with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error saving store_items: ${error}`);
  }
};

const updateStoreItem = async (where, data) => {
  try {
    logger.info(
      `updateStoreItem where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("store_items").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating store_items with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating store_items: ${error}`);
  }
};

const deleteStoreItem = async (where) => {
  try {
    logger.info(`deleteStoreItem where: ${JSON.stringify(where)}`);
    return await db("store_items").where(where).delete();
  } catch (error) {
    logger.error(
      `Error deleting store_items with data: ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error deleting store_items: ${error}`);
  }
};

const getStoreTypeByField = async (data, isRaw = false) => {
  try {
    const query = db("store_types").select("store_types.*");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting store_types with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting store_types data`);
  }
};

const getStoreLogsByField = async (data, isRaw = false) => {
  try {
    const query = db("store_logs")
      .select("store_logs.*")
      .select("store_items.name AS store_item_name")
      .select("store_items.price AS store_item_price")
      .select("store_items.currency AS store_item_currency")
      .select("company.name AS company_name")
      .select("bots.name AS bot_name")
      .leftJoin(
        "store_items",
        "store_logs.store_item_id",
        "store_items.uuid_unique"
      )
      .leftJoin("company", "store_logs.company_id", "company.uuid_unique")
      .leftJoin("bots", "store_logs.bot_id", "bots.uuid_unique");

    if (isRaw) {
      query.whereRaw(data);
    } else {
      query.where(data);
    }

    return query
      .then((result) => {
        return result.length > 0 ? result : [];
      })
      .catch(() => {
        return [];
      });
  } catch (error) {
    logger.error(
      `Error getting store_logs with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error getting store_logs data`);
  }
};

const saveStoreLog = async (data) => {
  try {
    logger.info(`saveStoreLog with data: ${JSON.stringify(data)}`);
    const [storeLogID] = await db("store_logs").insert(data);
    return await getStoreLogsByField({
      "store_logs.id": storeLogID,
    });
  } catch (error) {
    logger.error(
      `Error saving store_logs with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error saving store_logs: ${error}`);
  }
};

const updateStoreLog = async (where, data) => {
  try {
    logger.info(
      `updateStoreLog where: ${JSON.stringify(
        where
      )} with data: ${JSON.stringify(data)}`
    );
    return await db("store_logs").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating store_logs with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error updating store_logs: ${error}`);
  }
};
const deleteStoreLog = async (where) => {
  try {
    logger.info(`deleteStoreLog where: ${JSON.stringify(where)}`);
    return await db("store_logs").where(where).delete();
  } catch (error) {
    logger.error(
      `Error deleting store_logs with data: ${JSON.stringify(
        where
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(`Error deleting store_logs: ${error}`);
  }
};

const getStoreLogsStatusEnums = async () => {
  try {
    return db
      .raw(
        `
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE 
          TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'store_logs'
          AND COLUMN_NAME = 'status'
    `
      )
      .then((result) => {
        const enumString = result[0][0].COLUMN_TYPE;
        return enumString
          .replace(/^enum\(|\)$/g, "")
          .split(",")
          .map((val) => val.trim().replace(/^'|'$/g, ""));
      });
  } catch (error) {
    throw new Error(`Error getting store_logs status enums: ${error}`);
  }
};
module.exports = {
  getStoreCategoryByField,
  saveStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  getStoreItemsByField,
  saveStoreItem,
  updateStoreItem,
  deleteStoreItem,
  getStoreTypeByField,
  getStoreLogsByField,
  saveStoreLog,
  updateStoreLog,
  deleteStoreLog,
  getStoreLogsStatusEnums,
};
