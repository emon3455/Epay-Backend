import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { SystemConfig } from "./systemConfig.model";
import { ISystemConfig } from "./systemConfig.interface";

const getConfig = async (): Promise<ISystemConfig> => {
  const cfg = await SystemConfig.findById("SYSTEM");
  if (!cfg) {
    throw new AppError(httpStatus.NOT_FOUND, "System config not found");
  }
  return cfg.toObject();
};

const upsertConfig = async (payload: Partial<ISystemConfig>) => {
  // sanity checks
  ["agentCashInRate", "userSendMoneyRate", "userWithdrawRate"].forEach((k) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (payload as any)[k];
    if (v != null && v < 0) {
      throw new AppError(httpStatus.BAD_REQUEST, `${k} cannot be negative`);
    }
  });

  const updated = await SystemConfig.findByIdAndUpdate(
    "SYSTEM",
    { $set: payload },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return updated!;
};

export const SystemConfigService = { getConfig, upsertConfig };
