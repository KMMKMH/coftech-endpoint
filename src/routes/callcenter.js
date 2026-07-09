const express = require("express");
const router = express.Router();

const {
  getCallCenterCategory,
  saveCallCenterCategory,
  updateCallCenterCategory,
  getCallCenterDepartment,
  saveCallCenterDepartment,
  updateCallCenterDepartment,
  deleteCallCenterDepartment,
  deleteCallCenterCategory,
  getCallCenterDepartmentSchedule,
  saveCallCenterDepartmentSchedule,
  updateCallCenterDepartmentSchedule,
  deleteCallCenterDepartmentSchedule,
  getCallCenterDepartmentScheduleOff,
  saveCallCenterDepartmentScheduleOff,
  updateCallCenterDepartmentScheduleOff,
  deleteCallCenterDepartmentScheduleOff,
  getCallCenterDepartmentAgent,
  saveCallCenterDepartmentAgent,
  updateCallCenterDepartmentAgent,
  deleteCallCenterDepartmentAgent,
  getCallCenterQuickResponse,
  saveCallCenterQuickResponse,
  updateCallCenterQuickResponse,
  deleteCallCenterQuickResponse,
  getCallCenterChatByStatus,
  updateCallCenterChatStatus,
  getCallCenterClosedChats,
} = require("../controllers/callcenter");
const urlAccess = require("../utils/routerPermissions");

router.use(async (req, res, next) => {
  const advisorPaths = [
    { path: "/agents", methods: ["GET"] },
    { path: "/departments", methods: ["GET"] },
    { path: "/department/schedule", methods: ["GET"] },
    { path: "/department/schedule-off", methods: ["GET"] },
    {
      path: "/agents/quick-response",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
    { path: "/agents/chats/status", methods: ["PUT", "GET"] },
    { path: "/agents/chats/closed", methods: ["GET"] },
  ];

  const roles = ["SUPERADMIN", "ADMIN", "MANAGER"];
  if (
    advisorPaths.some(
      (path) => req.path === path.path && path.methods.includes(req.method)
    )
  ) {
    roles.push("ADVISOR");
  }

  urlAccess(req, res, next, roles);
});

router
  .route("/category")
  .get(getCallCenterCategory)
  .post(saveCallCenterCategory)
  .put(updateCallCenterCategory)
  .delete(deleteCallCenterCategory);

router
  .route("/agents")
  .get(getCallCenterDepartmentAgent)
  .post(saveCallCenterDepartmentAgent)
  .put(updateCallCenterDepartmentAgent)
  .delete(deleteCallCenterDepartmentAgent);

router
  .route("/departments")
  .get(getCallCenterDepartment)
  .post(saveCallCenterDepartment)
  .put(updateCallCenterDepartment)
  .delete(deleteCallCenterDepartment);

router
  .route("/department/schedule")
  .get(getCallCenterDepartmentSchedule)
  .post(saveCallCenterDepartmentSchedule)
  .put(updateCallCenterDepartmentSchedule)
  .delete(deleteCallCenterDepartmentSchedule);

router
  .route("/department/schedule-off")
  .get(getCallCenterDepartmentScheduleOff)
  .post(saveCallCenterDepartmentScheduleOff)
  .put(updateCallCenterDepartmentScheduleOff)
  .delete(deleteCallCenterDepartmentScheduleOff);

router
  .route("/agents/quick-response")
  .get(getCallCenterQuickResponse)
  .post(saveCallCenterQuickResponse)
  .put(updateCallCenterQuickResponse)
  .delete(deleteCallCenterQuickResponse);

router.route("/agents/chats/status").get(getCallCenterChatByStatus).put(updateCallCenterChatStatus);

router.route("/agents/chats/closed").get(getCallCenterClosedChats);

module.exports = router;
