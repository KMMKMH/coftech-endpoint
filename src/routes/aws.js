const express = require("express");
const router = express.Router();

const {
  listMachines,
  createMachine,
  listBotsPerMachine,
  putInstancePorts,
  deleteMachine,
  instanceReady,
  updateBotInstance,
  restartInstance,
} = require("../controllers/aws");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN"]);
});

router
  .route("/instances")
  .get(listMachines)
  .post(createMachine)
  .delete(deleteMachine);
router.route("/instances/bots").get(listBotsPerMachine).put(updateBotInstance);
router.put("/instances/ports", putInstancePorts);
router.post("/instances/ready", instanceReady);
router.post("/instances/restart", restartInstance);
module.exports = router;
