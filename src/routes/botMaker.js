const express = require("express");
const router = express.Router();

const urlAccess = require("../utils/routerPermissions");

const {
  getChannels,
  getWhatsappTemplates,
  getIntentList,
  sendTriggerIntent,
  getVariableList,
} = require("../controllers/botMaker");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.route("/channels").get(getChannels);
router.route("/intents").get(getIntentList);
router.route("/variables").get(getVariableList);
router.route("/trigger-intent").post(sendTriggerIntent);
router.route("/whatsapp-templates").get(getWhatsappTemplates);


module.exports = router;  