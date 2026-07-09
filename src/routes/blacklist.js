const express = require("express");
const router = express.Router();

const {
  createBlacklist,
  getBlacklistList,
  deleteBlacklist,
} = require("../controllers/blacklist");

const urlAccess = require("../utils/routerPermissions");

router.use((req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]));

router
  .route("/")
  .get(getBlacklistList)
  .post(createBlacklist)
  .delete(deleteBlacklist);

module.exports = router;
