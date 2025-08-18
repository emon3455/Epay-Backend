import express from "express";
import { Role } from "../user/user.interface";
import { getSystemConfig, putSystemConfig } from "./systemConfig.controller";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

router.get(
  "/",
  checkAuth(Role.USER, Role.AGENT, Role.ADMIN, Role.SUPER_ADMIN),
  getSystemConfig
); // anyone logged-in can read
router.put("/", checkAuth(Role.ADMIN, Role.SUPER_ADMIN), putSystemConfig); // only ADMINS can change

export const SystemConfigRoutes = router;
