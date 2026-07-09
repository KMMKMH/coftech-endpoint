const express = require("express");
const router = express.Router();
const {
  saveMessages,
  getMessagesLatest,
  getSocialNetwork,
  getLastConversationMessages,
} = require("../controllers/social");
const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});
router.route("/message").post(saveMessages);
router.route("/message/latest").get(getMessagesLatest);
router
  .route("/message/last-conversation")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    getLastConversationMessages
  );
router.route("/networks").get(getSocialNetwork);

module.exports = router;
