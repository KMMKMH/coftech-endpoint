const express = require("express");
const router = express.Router();

const {
  getCustomerTransactionalData,
  createPlanSubscription,
  getPlanSubscription,
  listPlanSubscriptions
} = require("../controllers/nmi");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.get("/", getCustomerTransactionalData);
router.route("/subscription")
  .get(getPlanSubscription)
  .post(createPlanSubscription);

router.get("/subscription/company", listPlanSubscriptions);

module.exports = router;
