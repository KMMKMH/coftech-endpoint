const express = require("express");
const router = express.Router();
const { saveOrders } = require("../controllers/orders");
const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  const userAgent = req.headers["user-agent"];

  if (
    userAgent.includes("https://shop.coftechservices.com") ||
    userAgent.includes("Webhook.site/2.0")
  ) {
    return next();
  }

  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});
router.route("/").post(saveOrders);

module.exports = router;
