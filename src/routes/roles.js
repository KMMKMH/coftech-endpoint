const express = require("express");
const router = express.Router();

const {
  createRoles,
  updateRoles,
  getRolesList,
  deleteRoles,
  addPermissionsRole,
  deletePermissionsRole,
  getRolePermissions,
} = require("../controllers/roles");

const urlAccess = require("../utils/routerPermissions");

router
  .route("/")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    createRoles
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    updateRoles
  )
  .delete(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    deleteRoles
  )
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getRolesList
  );

router
  .route("/permissions")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getRolePermissions
  )
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    addPermissionsRole
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    deletePermissionsRole
  );

module.exports = router;
