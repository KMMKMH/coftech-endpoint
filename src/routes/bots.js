const express = require("express");
const router = express.Router();

const {
  listBots,
  listBotExtensions,
  createBOT,
  updateBot,
  initializeBot,
  cancelInitializationBot,
  updateBotEvent,
  sendMessageBot,
  getBotInfo,
  stopBot,
  deleteBot,
  restartBot,
  startBot,
  saveBotExtension,
  updateBotExtension,
  deleteBotExtension,
  getBotSummary,
  getBotUsedTokens,
  getBotSocialNetworkActivations,
  updateBotSocialNetworkActivation,
  getBotConfigs,
  updateBotConfig,
  getBotActiveHours,
} = require("../controllers/bots");

const urlAccess = require("../utils/routerPermissions");

router.route("/active-hours").get(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN"]);
}, getBotActiveHours);

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.route("/").get(listBots).post(createBOT).put(updateBot);
router
  .route("/extensions")
  .get(listBotExtensions)
  .post(saveBotExtension)
  .put(updateBotExtension)
  .delete(deleteBotExtension);
router.post("/events/initialize", initializeBot);
router.post("/events/cancelInitialization", cancelInitializationBot);
router.post("/events/message", sendMessageBot);
router.get("/events/info", getBotInfo);
router.get("/events/stop", stopBot);
router.get("/events/delete", deleteBot);
router.post("/events/restart", restartBot);
router.post("/events/start", startBot);
router.put("/events", updateBotEvent);
router.get("/summary", getBotSummary);
router.route("/tokens_usage").get(getBotUsedTokens);

router
  .route("/social-network-activations")
  .get(getBotSocialNetworkActivations)
  .put(updateBotSocialNetworkActivation);

router.route("/configs").put(updateBotConfig).get(getBotConfigs);

module.exports = router;
