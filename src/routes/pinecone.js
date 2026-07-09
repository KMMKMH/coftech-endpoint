const express = require("express");
const router = express.Router();

const urlAccess = require("../utils/routerPermissions");
const {
  disableDocument,
  getDisabledDocuments,
  deleteDisabledDocument,
} = require("../controllers/pinecone");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router
  .route("/disabled-documents")
  .get(getDisabledDocuments)
  .post(disableDocument)
  .delete(deleteDisabledDocument);

module.exports = router;
