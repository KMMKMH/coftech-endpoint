const express = require("express");
const router = express.Router();

const urlAccess = require("../utils/routerPermissions");

const {
  verifyRaffleUser,
  verifyUserWithCode,
  updateUserInfo,
  verifyInvoice,
  getCompanyConfig,
  saveCompanyConfig,
  updateCompanyConfig,
  setCompanyConfigs,
  saveLottery,
  getLottery,
  updateLottery,
  deleteLottery,
  getInvoices,
  getUsers,
  getLotteryConfigs,
  saveLotteryConfig,
  updateLotteryConfigs,
  getRoles,
  saveRole,
  deleteRole,
  updateRole,
  getUserRoles,
  saveUserRole,
  deleteUserRole,
  updateUserRole,
  getLotteryWinner,
} = require("../controllers/raffle");

router.route("/auth/verification").post(verifyRaffleUser);
router.route("/auth/verify-code").post(verifyUserWithCode);
router.route("/user").put(updateUserInfo);
router.route("/invoices").get(getInvoices);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .get("/user", getUsers);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .post("/verify/invoice", verifyInvoice);
router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .get("/company/configs", getCompanyConfig)
  .post("/company/configs", saveCompanyConfig)
  .put("/company/configs", updateCompanyConfig);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .post("/company/initial-configs", setCompanyConfigs);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .post("/lottery", saveLottery)
  .get("/lottery", getLottery)
  .put("/lottery", updateLottery)
  .delete("/lottery", deleteLottery);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
  })
  .get("/lottery/winner", getLotteryWinner);


router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .get("/lottery/configs", getLotteryConfigs)
  .post("/lottery/configs", saveLotteryConfig)
  .put("/lottery/configs", updateLotteryConfigs);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .get("/roles", getRoles)
  .post("/roles", saveRole)
  .delete("/roles", deleteRole)
  .put("/roles", updateRole);

router
  .use(async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  })
  .get("/user/roles", getUserRoles)
  .post("/user/roles", saveUserRole)
  .put("/user/roles", updateUserRole)
  .delete("/user/roles", deleteUserRole);

module.exports = router;
