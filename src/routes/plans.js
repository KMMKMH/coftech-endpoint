const express = require("express");
const router = express.Router();

const urlAccess = require("../utils/routerPermissions");

const {
  savePlans,
  listPlans,
  updatePlans,
  deletePlans,
  listPlansExtensions,
  deletePlansExtensions,
  savePlansExtensions,
} = require("../controllers/plans");

router.use("/", async (req, res, next) => {
  if (req.method === "GET") {
    return await urlAccess(req, res, next, ["ADMIN", "SUPERADMIN"]);
  }

  return await urlAccess(req, res, next, ["SUPERADMIN"]);
});

router
  .route("/")
  .get(listPlans)
  .post(savePlans)
  .put(updatePlans)
  .delete(deletePlans);

router
  .route("/extensions")
  .get(listPlansExtensions)
  .post(savePlansExtensions)
  .delete(deletePlansExtensions);

module.exports = router;
