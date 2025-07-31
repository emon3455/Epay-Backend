import { Transaction } from "./transaction.model";
import { ITransaction } from "./transaction.interface";
import { JwtPayload } from "jsonwebtoken";

const createTransaction = async (data: ITransaction) => {
  return await Transaction.create(data);
};

const getMyTransactions = async (decodedToken: JwtPayload) => {
  return await Transaction.find({
    $or: [
      { sender: decodedToken.userId },
      { receiver: decodedToken.userId },
      { agent: decodedToken.userId },
    ],
  }).sort({ createdAt: -1 });
};

const getAllTransactions = async () => {
  return await Transaction.find()
    .populate("sender receiver agent")
    .sort({ createdAt: -1 });
};

const getAgentCommission = async (decodedToken: JwtPayload) => {
  const transactions = await Transaction.find({ agent: decodedToken.userId });
  const totalCommission = transactions.reduce(
    (acc, tx) => acc + (tx.commission || 0),
    0
  );
  return {
    totalCommission,
    transactions,
  };
};

export const TransactionService = {
  createTransaction,
  getMyTransactions,
  getAllTransactions,
  getAgentCommission,
};
