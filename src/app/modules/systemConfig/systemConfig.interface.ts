export interface ISystemConfig {
  _id: string; 
  agentCashInRate: number; // e.g., 0.015
  userSendMoneyRate: number; // e.g., 0.005
  userWithdrawRate: number; // e.g., 0.01
  updatedAt?: Date;
  createdAt?: Date;
}
