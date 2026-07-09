const express = require("express");
const router = express.Router();

const {
  getCompanyList,
  createCompany,
  updateCompany,
  getCompanyConfigs,
  updateCompanyConfigs,
} = require("../controllers/company");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.route("/").get(getCompanyList).post(createCompany).put(updateCompany);
router.route("/config").get(getCompanyConfigs).put(updateCompanyConfigs);
module.exports = router;
