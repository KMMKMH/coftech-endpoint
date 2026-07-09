const express = require("express");
const router = express.Router();

const {
  getTableColumns,
  insertTableData,
  deleteTableData,
  getBaseTables,
} = require("../controllers/noco.js");
const urlAccess = require("../utils/routerPermissions");

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .route("/table")
  .post(insertTableData)
  .delete(deleteTableData);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .route("/base")
  .get(getBaseTables);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .route("/base/columns")
  .get(getTableColumns);

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});


module.exports = router;
