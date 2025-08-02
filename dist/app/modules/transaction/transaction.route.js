"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionRoutes = void 0;
const express_1 = require("express");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const transaction_controller_1 = require("./transaction.controller");
const router = (0, express_1.Router)();
// USER / AGENT
router.get("/me", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER, user_interface_1.Role.AGENT), transaction_controller_1.TransactionController.getMyTransactions);
// ADMIN
router.get("/admin/all", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), transaction_controller_1.TransactionController.getAllTransactions);
// agent
router.get("/agent/commission/:id", (0, checkAuth_1.checkAuth)(user_interface_1.Role.AGENT, user_interface_1.Role.ADMIN), transaction_controller_1.TransactionController.getAgentCommission);
exports.TransactionRoutes = router;
