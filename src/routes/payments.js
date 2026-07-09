const express = require("express");
const router = express.Router();

const {
  processPaymentRequest,
  generatePaymentToken,
  getProviders,
  generatePaymentAuthCode,
  verifyPaymentAuthCode,
  getPaymentStatus
} = require("../controllers/payments");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.route("/").post(generatePaymentToken);
router.route("/process").post(processPaymentRequest);
router.route("/providers").get(getProviders);
router.route("/auth-code").get(verifyPaymentAuthCode).post(generatePaymentAuthCode);
router.route("/status").get(getPaymentStatus)
module.exports = router;
