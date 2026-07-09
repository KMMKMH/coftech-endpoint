const express = require("express");
const router = express.Router();

const { 
  getCampaigns, 
  createCampaign, 
  updateCampaign, 
  updateCampaignConfigs, 
  continueStoppedCampaign, 
  stopInProgressCampaign, 
  testCampaign,
} = require("../controllers/campaigns");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router.route("/").get(getCampaigns).post(createCampaign).put(updateCampaign);
router.route("/configs").put(updateCampaignConfigs);
router.route("/continue").post(continueStoppedCampaign);
router.route("/stop").post(stopInProgressCampaign);
router.route("/test").post(testCampaign);

module.exports = router;