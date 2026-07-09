const express = require("express");
const router = express.Router();

const { getActionLogs } = require("../controllers/dashboardLogs");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.route("/").get(getActionLogs);

module.exports = router;
