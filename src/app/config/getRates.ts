import { SystemConfigService } from "../modules/systemConfig/systemConfig.service";

export const getRates = async () => {
  const cfg = await SystemConfigService.getConfig();
  // Graceful defaults if any field is absent in DB
  return {
    agentCashInRate: cfg.agentCashInRate ?? 0,
    agentCashOutRate: cfg.agentCashOutRate ?? 0,
    userSendMoneyRate: cfg.userSendMoneyRate ?? 0,
    userWithdrawRate: cfg.userWithdrawRate ?? 0,
  };
};