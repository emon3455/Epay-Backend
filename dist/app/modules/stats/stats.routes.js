"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsRoutes = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const stats_controller_1 = require("./stats.controller");
const router = (0, express_1.Router)();
// System revenue summary (fees, commission, tx count)
router.get("/system-summary", (0, checkAuth_1.checkAuth)(user_interface_1.Role.SUPER_ADMIN, user_interface_1.Role.ADMIN), stats_controller_1.StatsControllers.systemSummary);
// Agent commission summary (per agent totals)
router.get("/agent-commission", (0, checkAuth_1.checkAuth)(user_interface_1.Role.SUPER_ADMIN, user_interface_1.Role.ADMIN), stats_controller_1.StatsControllers.agentCommissionSummary);
// All transactions that generated system revenue (fee/commission > 0)
router.get("/system-transactions", (0, checkAuth_1.checkAuth)(user_interface_1.Role.SUPER_ADMIN, user_interface_1.Role.ADMIN), stats_controller_1.StatsControllers.systemTransactions);
exports.StatsRoutes = router;
