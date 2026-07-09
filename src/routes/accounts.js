const express = require("express");
const router = express.Router();

const {
  getAccountList,
  updateAccount,
  deleteAccount,
  deleteCards,
  getAccountCardList,
} = require("../controllers/accounts");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.route("/").get(getAccountList).put(updateAccount).delete(deleteAccount);
router
  .route("/cards")
  .get(getAccountCardList)
  .delete(deleteCards);

module.exports = router;
