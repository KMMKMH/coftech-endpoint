const db = require("../utils/db");
const logger = require("../utils/logger");

const getAccountByField = async (data, isRaw = false) => {
  try {
    const query = db("accounts")
      .select("accounts.*")
      .select(
        "roles.uuid_unique AS role_id",
        "roles.key AS role_key",
        "roles.name AS role_name"
      )
      .select(
        "company.name AS company_name",
        "company.status AS company_status",
        "company.logo AS company_logo"
      )
      .leftJoin(
        "account_role",
        "accounts.uuid_unique",
        "account_role.account_id"
      )
      .leftJoin("company", "accounts.company_id", "company.uuid_unique")
      .leftJoin("roles", "account_role.role_id", "roles.uuid_unique");

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
      `Error getting account with data: ${JSON.stringify(data)}, isRaw: ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting account data`);
  }
};

const saveAccount = async (data) => {
  try {
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;
    logger.info(`saveAccount with data: ${JSON.stringify(data)}`);

    await db("accounts").insert(data);
    const response = (await getAccountByField({ "accounts.id": data.id }))[0];

    logger.info(`saveAccount response data: ${JSON.stringify(response)}`);
    return response;
  } catch (e) {
    logger.error(
      `Error saving accounts with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving accounts`);
  }
};

const updateAccount = async (where, data) => {
  try {
    delete data.id;
    delete data.uuid_unique;
    delete data.created_at;
    delete data.updated_at;

    logger.info(
      `Updating account with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}`
    );

    const response = await db("accounts").where(where).update(data);

    logger.info(`Update account response: ${response}`);
    return response;
  } catch (e) {
    logger.error(
      `Error updating account with where: ${JSON.stringify(
        where
      )}, data: ${JSON.stringify(data)}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating account`);
  }
};

const getRolesByField = async (data, isRaw = false) => {
  try {
    const query = db("roles");

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
      `Error getting rolees with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting rolees data`);
  }
};

const deleteAccount = async (data) => {
  try {
    logger.info(`deleteAccount where: ${JSON.stringify(data)}`);
    return await db("accounts").where(data).del();
  } catch (e) {
    logger.error(
      `Error deleting account with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error deleting account`);
  }
};

const deleteAccountRole = async (data) => {
  try {
    logger.info(`account_role where: ${JSON.stringify(data)}`);
    return await db("account_role").where(data).del();
  } catch (e) {
    logger.error(
      `Error deleting account_role with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error deleting account_role`);
  }
};

const getAccountCardByField = async (data, isRaw = false) => {
  try {
    const query = db("accounts_cards")

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
      `Error getting account_card with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting account_card data`);
  }
};

const saveAccountCard = async (data) => {
  try {
    logger.info(`saveAccountCard with data: ${JSON.stringify(data)}`);

    const [accountCardId] = await db("accounts_cards").insert(data);
    const response = accountCardId
      ? (await getAccountCardByField({ "accounts_cards.id": accountCardId }))[0]
      : false;

    logger.info(`saveAccountCard response data: ${JSON.stringify(response)}`);
    return response;
  } catch (e) {
    logger.error(
      `Error saving AccountCard with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving AccountCard`);
  }
};

const deleteAccountCard = async (data) => {
  try {
    logger.info(`deleteAccountCard where: ${JSON.stringify(data)}`);
    return await db("accounts_cards").where(data).del();
  } catch (e) {
    logger.error(
      `Error deleting account card with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error deleting account card`);
  }
};

module.exports = {
  getAccountByField,
  saveAccount,
  getRolesByField,
  updateAccount,
  deleteAccount,
  deleteAccountRole,
  getAccountCardByField,
  saveAccountCard,
  deleteAccountCard,
};
