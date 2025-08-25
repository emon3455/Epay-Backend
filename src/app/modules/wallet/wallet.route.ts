import { Router } from "express";
import { WalletController } from "./wallet.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { agentCashZodSchema, sendMoneyZodSchema, withdrawMoneyZodSchema } from "./wallet.validation";

const router = Router();

// USER & AGENT
router.get("/me", checkAuth(Role.USER, Role.AGENT), WalletController.getMyWallet);

// USER
router.post("/add-money", checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN), WalletController.addMoney);
router.post("/withdraw-money", checkAuth(Role.USER), validateRequest(withdrawMoneyZodSchema), WalletController.withdrawMoney);
router.post("/send-money", checkAuth(Role.USER), validateRequest(sendMoneyZodSchema), WalletController.sendMoney);

// AGENT
router.post("/cash-in", checkAuth(Role.AGENT), validateRequest(agentCashZodSchema), WalletController.agentCashIn);
router.post("/cash-out", checkAuth(Role.AGENT), validateRequest(agentCashZodSchema), WalletController.agentCashOut);

// ADMIN
router.get("/admin/all", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), WalletController.getAllWallets);
router.patch("/admin/block/:id", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), WalletController.blockWallet);

export const WalletRoutes = router;
