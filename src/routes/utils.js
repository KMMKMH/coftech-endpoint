const express = require("express");
const router = express.Router();

const urlAccess = require("../utils/routerPermissions");

const { listCoreConfigs } = require("../controllers/company");
const { listExtensions } = require("../controllers/extensions");
const { generateRandomToken, updateToken } = require("../controllers/auth");
const { processOCRImageToText } = require("../controllers/ocr");
const { getOpenaiCosts } = require("../controllers/bots");
const {
  listCurrencies,
  listCountries,
  listPeriodOfDays,
  listDaysOfWeek,
  getAllEndpoints,
  createAndStoreEmbedding,
  createNotification,
  listActionTypes,
  listResourceTypes,
} = require("../controllers/utils");

router.get("/core/configs", listCoreConfigs);
router.get("/extensions", listExtensions);
router.get("/currencies", listCurrencies);
router.get("/countries", listCountries);
router.get("/days/periods", listPeriodOfDays);
router.get("/days/week", listDaysOfWeek);
router.get("/action/types", listActionTypes);
router.get("/resource/types", listResourceTypes);

router.post(
  "/token",
  async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  },
  generateRandomToken
);

router.put(
  "/token",
  async (req, res, next) => {
    urlAccess(req, res, next, ["SUPERADMIN"]);
  },
  updateToken
);

router
  .route("/ocr/image_to_text")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    processOCRImageToText
  );

router
  .route("/endpoints")
  .get(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getAllEndpoints
  );

router
  .route("/embeddings/save")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    createAndStoreEmbedding
  );

router
  .route("/notification")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN"]),
    createNotification
  );

router
  .route("/openai/costs")
  .post(
    (req, res, next) => urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]),
    getOpenaiCosts
  );

module.exports = router;
