import { Wallet } from "../modules/wallet/wallet.model";
import { User } from "../modules/user/user.model";
import { envVars } from "../config/env";
import httpStatus from "http-status-codes";
import AppError from "../errorHelpers/AppError";

export const getSystemWallet = async () => {
  const systemUser = await User.findOne({ email: envVars.SUPER_ADMIN_EMAIL });
  if (!systemUser) throw new AppError(httpStatus.NOT_FOUND, "System admin not found");

  const systemWallet = await Wallet.findOne({ user: systemUser._id });
  if (!systemWallet) throw new AppError(httpStatus.NOT_FOUND, "System wallet not found");

  return systemWallet;
};