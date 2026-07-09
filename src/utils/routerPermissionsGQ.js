const repoAccounts = require("../repositories/accounts");
const repoRoles = require("../repositories/roles");

const withPermission = (allowedRoles, resolver) => {
  return async (parent, args, context, info) => {
    await checkPermission(context.user, allowedRoles, info.fieldName);
    return resolver(parent, args, context, info);
  };
};

const checkPermission = async (user, allowedRoles, operationName) => {
  if (!user) {
    throw new Error("User not authenticated");
  }

  const [accountField] = await repoAccounts.getAccountByField({
    "accounts.uuid_unique": user,
  });

  if (!accountField) {
    throw new Error("User not found");
  }

  const { role_id, role_key } = accountField;

  if (allowedRoles.length === 1 && allowedRoles[0] === "SUPERADMIN") {
    if (role_key !== "SUPERADMIN") {
      throw new Error("Access restricted to SUPERADMIN");
    }
    return true;
  }

  if (role_key === "SUPERADMIN") {
    return true;
  }

  if (allowedRoles.includes(role_key)) {
    return true;
  }

  const userPermissions = await repoRoles.getPermissionsRole({
    "role_permissions.role_id": role_id,
  });

  if (!userPermissions || userPermissions.length === 0) {
    throw new Error("Role does not have defined permissions");
  }

  if (userPermissions.includes(operationName)) {
    return;
  }

  throw new Error("You lack the required permissions to access this operation");
};

module.exports = { checkPermission, withPermission };
