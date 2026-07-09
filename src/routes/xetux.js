const express = require("express");
const router = express.Router();
const { getSales, getPurchases } = require("../controllers/xetux");
const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});
router.route("/sales").get(getSales);
router.route("/purchases").get(getPurchases);

module.exports = router;
