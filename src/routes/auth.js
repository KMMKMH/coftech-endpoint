const express = require("express");
const router = express.Router();

const {
  loginAccount,
  registerAccount,
  recoveryPassword,
  verifyCode,
  savePassword,
} = require("../controllers/auth");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  const url = req.path.split("/")[1];

  if (url === "register") {
    urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
  } else {
    next();
  }
});

router.post("/login", loginAccount);
router.post("/register", registerAccount);
router.put("/save/password", savePassword);
router.post("/recovery/password", recoveryPassword);
router.post("/verify/code", verifyCode);

module.exports = router;
