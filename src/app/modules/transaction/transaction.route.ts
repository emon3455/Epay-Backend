import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { TransactionController } from "./transaction.controller";

const router = Router();

// USER / AGENT
router.get("/me", checkAuth(Role.USER, Role.AGENT), TransactionController.getMyTransactions);

// ADMIN
router.get("/admin/all", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), TransactionController.getAllTransactions);

// AGENT
router.get("/agent/commission", checkAuth(Role.AGENT), TransactionController.getAgentCommission);

export const TransactionRoutes = router;
