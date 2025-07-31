import { Schema, model } from "mongoose";
import { ITransaction, TransactionType } from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>(
  {
    type: { type: String, enum: TransactionType, required: true },
    amount: { type: Number, required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    receiver: { type: Schema.Types.ObjectId, ref: "User" },
    agent: { type: Schema.Types.ObjectId, ref: "User" },
    fee: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Transaction = model<ITransaction>("Transaction", transactionSchema);
