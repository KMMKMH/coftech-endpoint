const express = require("express");
const router = express.Router();

const {
  createBase,
  updateBase,
  getBaseList,
  deleteBase,
  createTable,
  getTableList,
  updateTable,
  deleteTable,
  insertData,
  getData,
  updateData,
  deleteData,
  createColumn,
  deleteColumn,
  updateColumn,
  getColumnList,
} = require("../controllers/desk");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router
  .route("/base")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    createBase
  )
  .put(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    updateBase
  )
  .delete(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    deleteBase
  )
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getBaseList
  );

router
  .route("/table")
  .post(createTable)
  .put(updateTable)
  .delete(deleteTable)
  .get(getTableList);

router
  .route("/table/column")
  .post(createColumn)
  .delete(deleteColumn)
  .put(updateColumn)
  .get(getColumnList);

router
  .route("/table/data")
  .post(insertData)
  .get(getData)
  .put(updateData)
  .delete(deleteData);

module.exports = router;
