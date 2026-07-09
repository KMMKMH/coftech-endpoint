const express = require("express");
const router = express.Router();

const {
  createStorage,
  updateStorage,
  getStorageList,
  deleteStorage,
  getStorageLogsList,
} = require("../controllers/storage");

const urlAccess = require("../utils/routerPermissions");

router
  .route("/")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    createStorage
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    updateStorage
  )
  .delete(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    deleteStorage
  )
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    getStorageList
  );

router
  .route("/logs")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    getStorageLogsList
  );

module.exports = router;
