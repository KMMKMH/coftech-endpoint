const express = require("express");
const router = express.Router();

const {
  getSystemPrompt,
  createSystemPrompt,
  updateSystemPrompt,
  deleteSystemPrompt,
  getSystemPromptBackup,
} = require("../controllers/systemPrompts");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN"]);
});

router
  .route("/")
  .get(getSystemPrompt)
  .post(createSystemPrompt)
  .put(updateSystemPrompt)
  .delete(deleteSystemPrompt);

router.route("/backup").get(getSystemPromptBackup);

module.exports = router;
