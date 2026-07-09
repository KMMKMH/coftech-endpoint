const express = require("express");
const router = express.Router();
const { saveUrl, getUrl, listUrl } = require("../controllers/url");
const urlAccess = require("../utils/routerPermissions");

router.post(
  "/",
  async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  },
  saveUrl,
);

router.get("/", getUrl);

router.get(
  "/company",
  async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
  },
  listUrl,
);

module.exports = router;
