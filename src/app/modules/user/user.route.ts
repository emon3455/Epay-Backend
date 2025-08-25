import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";

const router = Router();

router.get("/me", checkAuth(...Object.values(Role)), UserControllers.getMe)
router.post("/register",validateRequest(createUserZodSchema), UserControllers.createUser);
router.get(
  "/all-user",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN, Role.AGENT, Role.USER),
  UserControllers.getAllUsers
);
router.get(
  "/all-agent",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllAgent
);
router.get(
  "/all-system-user",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllSystemUser
);
router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.updateUser
);
router.patch(
  "/agent/approve-reject/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.approveRejectAgent
);
router.patch(
  "/approve-reject/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.approveRejectUser
);
export const UserRoutes = router;
