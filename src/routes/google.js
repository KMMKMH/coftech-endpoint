const express = require("express");
const router = express.Router();

const {
  googleAuth,
  generateAuthUrl,
  revokeAuth,
  getAuthState,
  getScopes,
} = require("../controllers/google");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  const url = req.path;

  if (url.includes("/auth/callback")) {
    return next();
  } else {
    urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
  }
});

router.get("/auth", generateAuthUrl);
router.get("/auth/revoke", revokeAuth);
router.get("/auth/state", getAuthState);
router.get("/scopes", getScopes);
router.get("/auth/callback", googleAuth);

module.exports = router;
