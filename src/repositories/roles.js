const db = require("../utils/db");
const logger = require("../utils/logger");

const getRoleByField = async (data, isRaw = false) => {
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
      `Error getting role with data: ${JSON.stringify(
        data
      )} ${isRaw}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error getting role data`);
  }
};

const saveAccountRole = async (data) => {
  try {
    logger.info(`saveAccountRole with data: ${JSON.stringify(data)}`);

    return await db("account_role").insert(data);
  } catch (e) {
    logger.error(
      `Error saving accounts with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error saving account_role: ${e}`);
  }
};

const updateAccountRole = async (account_id, role_id) => {
  try {
    logger.info(
      `updateAccountRole where account_id: ${account_id} with role: ${role_id}`
    );

    return await db("account_role")
      .where("account_role.account_id", account_id)
      .update({ role_id });
  } catch (e) {
    logger.error(
      `Error updating account role with data: ${JSON.stringify(
        account_id
      )}, ${role_id} error: ${JSON.stringify(e)}`
    );
    throw new Error(`Error updating account role: ${e}`);
  }
};

const saveRole = async (data) => {
  try {
    logger.info(`Saving role with data: ${JSON.stringify(data)}`);
    const [roleID] = await db("roles").insert(data);
    const response = roleID
      ? await getRoleByField({ [`roles.id`]: roleID })
      : false;
    return response;
  } catch (error) {
    logger.error(
      `Error saving Role with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
    throw new Error(
      `Error saving Role with data: ${JSON.stringify(
        data
      )}, error: ${JSON.stringify(error)}`
    );
  }
};

const deleteRole = async (where) => {
  try {
    logger.info(`Deleting Role where: ${where}`);
    return await db("roles").where(where).del();
  } catch (error) {
    logger.error(
      `Error deleting Role with ID: ${where}, error: ${error.message}`
    );
    throw new Error(`Error deleting role`);
  }
};

const updateRole = async (where, data) => {
  try {
    logger.info(
      `Updating Role where: ${where} with data: ${JSON.stringify(data)}`
    );
    return await db("roles").where(where).update(data);
  } catch (error) {
    logger.error(
      `Error updating Roles with data: ${JSON.stringify(data)}, error: ${
        error.message
      }`
    );
    throw new Error(error.message);
  }
};

const getPermissionsRole = async (where) => {
  try {
    const permissions = await db("role_permissions")
      .where(where)
      .select("role_permissions.route_key");

    return permissions.map((permission) => permission.route_key);
  } catch (error) {
    logger.error(
      `Error fetching permissions for role with ID ${JSON.stringify(where)}: ${
        error.message
      }`
    );
    throw new Error(
      `Error fetching permissions for role with ID ${JSON.stringify(where)}: ${
        error.message
      }`
    );
  }
};

const addPermissionToRole = async (permissionsData) => {
  try {
    await db("role_permissions").insert(permissionsData);
  } catch (error) {
    logger.error(`Error adding permissions, error: ${error.message}`);
    throw new Error(`Error adding permissions to role`);
  }
};

const deletePermissionFromRole = async (roleID, routeKeys) => {
  try {
    await db("role_permissions")
      .whereIn("route_key", routeKeys)
      .andWhere("role_id", roleID)
      .del();
  } catch (error) {
    logger.error(
      `Error deleting permission from role with roleID: ${roleID} and routeKey: ${routeKeys}, error: ${error.message}`
    );
    throw new Error(
      `Error deleting permission from role with roleID: ${roleID} and routeKey: ${routeKeys}, error: ${error.message}`
    );
  }
};

module.exports = {
  getRoleByField,
  saveAccountRole,
  updateAccountRole,
  saveRole,
  deleteRole,
  updateRole,
  getPermissionsRole,
  addPermissionToRole,
  deletePermissionFromRole,
};
