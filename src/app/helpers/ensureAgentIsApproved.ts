import AppError from "../errorHelpers/AppError";
import { IsActive, IUser, Role } from "../modules/user/user.interface";
import httpStatus from "http-status-codes"

export const ensureAgentIsApproved = (user: Partial<IUser>) => {
  if (user.role === Role.AGENT && user.isActive === IsActive.PENDING) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent account is on pending state");
  }
};
