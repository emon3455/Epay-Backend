import { Schema, model } from "mongoose";
import { ISystemConfig } from "./systemConfig.interface";

const systemConfigSchema = new Schema<ISystemConfig>({
  _id: { type: String, default: "SYSTEM" },
  agentCashInRate:   { type: Number, required: true, min: 0 },
  agentCashOutRate:   { type: Number, required: true, min: 0 },
  userSendMoneyRate: { type: Number, required: true, min: 0 },
  userWithdrawRate:  { type: Number, required: true, min: 0 },
}, {
  timestamps: true,
  versionKey: false,
});

export const SystemConfig = model<ISystemConfig>("SystemConfig", systemConfigSchema);
