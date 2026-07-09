const express = require("express");
const router = express.Router();

const {
  listExtensions,
  updateExtension,
  createExtensionCategory,
  deleteExtensionCategory,
  updateExtensionCategory,
  listExtensionCategories,
  getExtensionConfigs,
  updateConfigTemplate,
} = require("../controllers/extensions");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router
  .route("/")
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    updateExtension
  )
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    listExtensions
  );

router
  .route("/categories")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    createExtensionCategory
  )
  .delete(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    deleteExtensionCategory
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    updateExtensionCategory
  )
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    listExtensionCategories
  );

router
  .route("/configs")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    getExtensionConfigs
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    updateConfigTemplate
  );

module.exports = router;
