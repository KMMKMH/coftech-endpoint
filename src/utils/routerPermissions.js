const repoAccounts = require("../repositories/accounts");
const repoRoles = require("../repositories/roles");

const checkPermission = async (req, res, next, roles) => {
  try {
    const { user } = req.unique_token;

    const [accountField] = await repoAccounts.getAccountByField({
      "accounts.uuid_unique": user,
    });

    if (!accountField) {
      throw new Error("Token error, invalid information");
    }

    if (roles.length === 1 && roles.includes("SUPERADMIN")) {
      if (accountField.role_key === "SUPERADMIN") {
        return next();
      } else {
        return res.status(403).json({
          code: 403,
          status: false,
          message: "Access restricted",
        });
      }
    }

    if (accountField.role_key === "SUPERADMIN") {
      return next();
    }

    if (roles.includes(accountField.role_key)) {
      return next();
    }

    const userPermissions = await repoRoles.getPermissionsRole({
      "role_permissions.role_id": accountField.role_id,
    });

    if (!userPermissions || userPermissions.length === 0) {
      return res.status(403).json({
        code: 403,
        status: false,
        message: "Role does not have defined permissions",
      });
    }

    const basePath = req.baseUrl.split("/").filter(Boolean).pop();
    const subPath = req.path.split("/").filter(Boolean).join(":");

    const dynamicPermissionKey =
      basePath && subPath
        ? `${basePath}:${subPath}:${req.method.toLowerCase()}`
        : `${basePath}:${req.method.toLowerCase()}`;

    if (userPermissions.includes(dynamicPermissionKey)) {
      return next();
    }

    return res.status(403).json({
      code: 403,
      status: false,
      message: "You lack the required permissions to access this route",
    });
  } catch (e) {
    res.status(401).json({
      code: 401,
      status: false,
      message: e.message,
    });
  }
};

module.exports = checkPermission;
