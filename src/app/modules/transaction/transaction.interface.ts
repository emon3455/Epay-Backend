import { Types } from "mongoose";

export enum TransactionType {
    ADDMONEY = "ADDMONEY",
    WITHDRAWMONEY = "WITHDRAWMONEY",
    SENDMONEY = "SENDMONEY",
    CASHIN = "CASHIN",
    CASHOUT = "CASHOUT"
}

export interface ITransaction {
  _id?: Types.ObjectId;
  type: TransactionType;
  amount: number;
  sender?: Types.ObjectId;
  receiver?: Types.ObjectId;
  agent?: Types.ObjectId;
  fee?: number;
  commission?: number;
  createdAt?: Date;
}
