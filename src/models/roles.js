const repoRoles = require("../repositories/roles");
const logger = require("../utils/logger");
const crypto = require("crypto");

const generateKeyFromName = (name) => {
  const randomValue = crypto.randomBytes(4).toString("hex");
  const symbol = "#";
  const key = `${name.toUpperCase()}${symbol}${randomValue}`;
  return key;
};

const checkDuplicatePermissions = async (companyID, permissions) => {
  try {
    const roles = await repoRoles.getRoleByField({
      "roles.company_id": companyID,
    });

    for (let role of roles) {
      const rolePermissions = await repoRoles.getPermissionsRole({
        "role_permissions.role_id": role.uuid_unique,
      });

      const existingPermissions = rolePermissions.sort();
      const newPermissions = permissions.sort();

      if (
        JSON.stringify(existingPermissions) === JSON.stringify(newPermissions)
      ) {
        throw new Error(
          `There is a role with exactly the same permissions: ${role.name}`
        );
      }
    }

    return true;
  } catch (error) {
    logger.error(
      `Error checking permissions for company ${companyID}, error: ${error.message}`
    );
    throw new Error(error.message);
  }
};

const saveRoles = async (rolesInfo) => {
  try {
    const { name, companyID } = rolesInfo;

    const key = generateKeyFromName(name);

    const rolesData = {
      name,
      key,
      company_id: companyID,
    };

    const result = await repoRoles.saveRole(rolesData);
    return result;
  } catch (error) {
    throw new Error(`Error saving role: ${error.message}`);
  }
};

const updateRoles = async (query, data) => {
  try {
    const { roleID, companyID } = query;

    const [roleField] = await repoRoles.getRoleByField({
      "roles.uuid_unique": roleID,
    });

    if (!roleField) {
      throw new Error(`Role with ID ${roleID} not found`);
    }

    const dontUpdateFields = [
      "id",
      "uuid_unique",
      "created_at",
      "updated_at",
      "key",
      "company_id",
    ];

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([key]) => !dontUpdateFields.includes(key))
    );

    if (Object.keys(filteredData).length === 0) {
      return false;
    }

    const where = {
      "roles.uuid_unique": roleID,
      "roles.company_id": companyID,
    };

    return await repoRoles.updateRole(where, filteredData);
  } catch (error) {
    throw new Error(`Error updating roles: ${error.message}`);
  }
};

const deleteRoles = async (whereData) => {
  try {
    const { roleID, companyID } = whereData;

    const [roleField] = await repoRoles.getRoleByField({
      "roles.uuid_unique": roleID,
    });

    if (!roleField) {
      throw new Error(`Role with ${roleID} does not exist`);
    }

    return await repoRoles.deleteRole({
      "roles.uuid_unique": roleID,
      "roles.company_id": companyID,
    });
  } catch (error) {
    throw new Error(error);
  }
};

const addRolePermissions = async (query, permissions) => {
  try {
    const { roleID, companyID } = query;

    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new Error("Permissions must be a non-empty array");
    }

    const actualPermissions = await repoRoles.getPermissionsRole({
      "role_permissions.role_id": roleID,
    });

    const mergedPermissions = [
      ...new Set([...actualPermissions, ...permissions]),
    ];

    await checkDuplicatePermissions(companyID, mergedPermissions);

    const permissionsData = permissions.map((routeKey) => ({
      role_id: roleID,
      route_key: routeKey,
    }));

    return await repoRoles.addPermissionToRole(permissionsData);
  } catch (error) {
    logger.error(
      `Error adding permissions to role with roleID: ${JSON.stringify(
        query
      )}, error: ${error.message}`
    );
    throw new Error(
      `Error adding permissions to role with roleID: ${JSON.stringify(
        query
      )}, error: ${error.message}`
    );
  }
};

const deletePermissionsRole = async (roleID, permissions) => {
  try {
    if (!Array.isArray(permissions) || permissions.length === 0) {
      throw new Error("Permissions must be a non-empty array");
    }

    return await repoRoles.deletePermissionFromRole(roleID, permissions);
  } catch (error) {
    logger.error(
      `Error deleting permissions from role with roleID: ${roleID}, error: ${error.message}`
    );
    throw new Error(
      `Error deleting permissions from role with roleID: ${roleID}, error: ${error.message}`
    );
  }
};

module.exports = {
  saveRoles,
  updateRoles,
  deleteRoles,
  addRolePermissions,
  deletePermissionsRole,
};
