"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletRoutes = void 0;
const express_1 = require("express");
const wallet_controller_1 = require("./wallet.controller");
const checkAuth_1 = require("../../middlewares/checkAuth");
const user_interface_1 = require("../user/user.interface");
const validateRequest_1 = require("../../middlewares/validateRequest");
const wallet_validation_1 = require("./wallet.validation");
const router = (0, express_1.Router)();
// USER & AGENT
router.get("/me", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER, user_interface_1.Role.AGENT), wallet_controller_1.WalletController.getMyWallet);
// USER
router.post("/add-money", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER, user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), (0, validateRequest_1.validateRequest)(wallet_validation_1.addMoneyZodSchema), wallet_controller_1.WalletController.addMoney);
router.post("/withdraw-money", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER, user_interface_1.Role.AGENT), (0, validateRequest_1.validateRequest)(wallet_validation_1.withdrawMoneyZodSchema), wallet_controller_1.WalletController.withdrawMoney);
router.post("/send-money", (0, checkAuth_1.checkAuth)(user_interface_1.Role.USER), (0, validateRequest_1.validateRequest)(wallet_validation_1.sendMoneyZodSchema), wallet_controller_1.WalletController.sendMoney);
// AGENT
router.post("/cash-in", (0, checkAuth_1.checkAuth)(user_interface_1.Role.AGENT), (0, validateRequest_1.validateRequest)(wallet_validation_1.agentCashZodSchema), wallet_controller_1.WalletController.agentCashIn);
router.post("/cash-out", (0, checkAuth_1.checkAuth)(user_interface_1.Role.AGENT), (0, validateRequest_1.validateRequest)(wallet_validation_1.agentCashZodSchema), wallet_controller_1.WalletController.agentCashOut);
router.post("/agent/withdraw-user-money", (0, checkAuth_1.checkAuth)(user_interface_1.Role.AGENT), wallet_controller_1.WalletController.agentWithdraw);
// ADMIN
router.get("/admin/all", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletController.getAllWallets);
router.patch("/admin/block/:id", (0, checkAuth_1.checkAuth)(user_interface_1.Role.ADMIN, user_interface_1.Role.SUPER_ADMIN), wallet_controller_1.WalletController.blockWallet);
exports.WalletRoutes = router;
