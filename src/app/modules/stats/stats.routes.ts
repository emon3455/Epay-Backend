import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { StatsControllers } from "./stats.controller";

const router = Router();

// System revenue summary (fees, commission, tx count)
router.get(
  "/system-summary",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  StatsControllers.systemSummary
);

// Agent commission summary (per agent totals)
router.get(
  "/agent-commission",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  StatsControllers.agentCommissionSummary
);

// All transactions that generated system revenue (fee/commission > 0)
router.get(
  "/system-transactions",
  checkAuth(Role.SUPER_ADMIN, Role.ADMIN),
  StatsControllers.systemTransactions
);

export const StatsRoutes = router;
