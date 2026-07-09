const express = require("express");
const router = express.Router();

const {
  createPrompt,
  listPrompts,
  updatePrompt,
  deletePrompt,
  assistancePrompt,
  testPrompt,
  getBackups
} = require("../controllers/prompts");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router
  .route("/")
  .get(listPrompts)
  .post(createPrompt)
  .put(updatePrompt)
  .delete(deletePrompt);

router.route("/test").post(testPrompt);

router.route("/assistance").post(assistancePrompt);

router.route("/backups").get(getBackups);

module.exports = router;
