const express = require("express");
const router = express.Router();
const {
  createDiscordWebhook,
  amazonSNSWebhook,
  verifyMetaWebhook,
  receiveMetaWebhook,
} = require("../controllers/webhooks");
const urlAccess = require("../utils/routerPermissions");

router.route("/meta/:botID").get(verifyMetaWebhook).post(receiveMetaWebhook);

const snsBodyParser = (req, res, next) => {
  const contentType = req.get('Content-Type');
  
  if (contentType && contentType.includes('application/json')) {
    express.json()(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  } else {
    express.raw({type: '*/*'})(req, res, (err) => {
      if (err) return next(err);
      try {
        req.body = JSON.parse(req.body.toString('utf8'));
      } catch {
        return next(new Error('Unable to parse body as JSON'));
      }
      next();
    });
  }
};

router
  .route("/actions/discord")
  .post(
    async (req, res, next) =>
      urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    createDiscordWebhook
  );

router.route("/amazon/sns").post(snsBodyParser, amazonSNSWebhook);

module.exports = router;
