const express = require("express");
const router = express.Router();

const { validateYappyPaymentStatus } = require("../controllers/yappy");

router.route("/paymentsbg").get(validateYappyPaymentStatus);

module.exports = router;
