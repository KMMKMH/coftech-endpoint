const express = require("express");
const router = express.Router();

const urlAccess = require("../utils/routerPermissions");
const {
  getStoreCategory,
  saveStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  getStoreItems,
  saveStoreItem,
  updateStoreItem,
  deleteStoreItem,
  getStoreTypes,
  generateUrlItem,
  getStoreLogs,
  saveStoreLog,
  deleteStoreLog,
  updateStoreLog,
} = require("../controllers/store");

const { upload, handleMulterError } = require("../utils/uploadStoreMiddleware");

router.route("/category").get(getStoreCategory);
router.route("/items").get(getStoreItems);
router.route("/types").get(getStoreTypes);
router.route("/generate-url").get(generateUrlItem);
router.route("/items/logs").get(getStoreLogs);

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN"]);
});

router
  .route("/category")
  .post(saveStoreCategory)
  .put(updateStoreCategory)
  .delete(deleteStoreCategory);

router
  .route("/items")
  .post(upload.array("images", 5), handleMulterError, saveStoreItem)
  .put(upload.array("images", 5), handleMulterError, updateStoreItem)
  .delete(deleteStoreItem);

router.route("/items/logs").post(saveStoreLog).put(updateStoreLog).delete(deleteStoreLog);

module.exports = router;
