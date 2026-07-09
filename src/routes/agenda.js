const express = require("express");
const router = express.Router();

const {
  getAgendaReserves,
  getAgendaReservesStatus,
  createAgendaReserve,
  updateAgendaReserve,
  deleteAgendaReserve,
  getAgendaLinkDetails,
  joinAgendaLinkReserve,
  getAgendaLinksByCompany,
  createAgendaLink,
  updateAgendaLink,
  deleteAgendaLink,
  getAgendaEventTypes,
  createAgendaEventType,
  updateAgendaEventType,
  deleteAgendaEventType,
  getAgendaBlockedHours,
  createAgendaBlockedHours,
  updateAgendaBlockedHours,
  deleteAgendaBlockedHours,
  getAgendaLogs,
} = require("../controllers/agenda");

const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  urlAccess(req, res, next, ["SUPERADMIN", "ADMIN"]);
});

router
  .route("/reserves")
  .get(getAgendaReserves)
  .post(createAgendaReserve)
  .put(updateAgendaReserve)
  .delete(deleteAgendaReserve);

router
  .route("/reserves/status")
  .get(getAgendaReservesStatus);

router
  .route("/links")
  .get(getAgendaLinksByCompany)
  .post(createAgendaLink)
  .put(updateAgendaLink)
  .delete(deleteAgendaLink);

router
  .route("/links/details")
  .get(getAgendaLinkDetails);

router
  .route("/links/join")
  .get(joinAgendaLinkReserve);

router
  .route("/event-types")
  .get(getAgendaEventTypes)
  .post(createAgendaEventType)
  .put(updateAgendaEventType)
  .delete(deleteAgendaEventType);

router
  .route("/blocks")
  .get(getAgendaBlockedHours)
  .post(createAgendaBlockedHours)
  .put(updateAgendaBlockedHours)
  .delete(deleteAgendaBlockedHours);

router
  .route("/logs")
  .get(getAgendaLogs);

module.exports = router;