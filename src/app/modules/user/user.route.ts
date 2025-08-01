import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserControllers } from "./user.controller";
import { Role } from "./user.interface";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";

const router = Router();

router.post("/register",validateRequest(createUserZodSchema), UserControllers.createUser);
router.get(
  "/all-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllUsers
);
router.get(
  "/all-agent",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.getAllAgent
);
router.patch(
  "/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.updateUser
);
router.patch(
  "agent/approve-reject/:id",
  validateRequest(updateUserZodSchema),
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  UserControllers.approveRejectAgent
);
export const UserRoutes = router;
