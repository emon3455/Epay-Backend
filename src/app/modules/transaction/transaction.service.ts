import { Transaction } from "./transaction.model";
import { ITransaction } from "./transaction.interface";
import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IGenericResponse } from "../../interfaces/common";

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

const getAllTransactions = async (
  query: Record<string, string>
): Promise<IGenericResponse<ITransaction[]>> => {
  const baseQuery = Transaction.find();

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const agents = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return {
    meta,
    data: agents,
  };
};

const getAgentCommission = async (
  decodedToken: JwtPayload,
  query: Record<string, string>
): Promise<IGenericResponse<ITransaction[]> & { totalCommission: number }> => {
  const modifiedQuery = { ...query, agent: decodedToken.userId };
  const baseQuery = Transaction.find();

  const queryBuilder = new QueryBuilder(baseQuery, modifiedQuery)
    .filter()
    .sort()
    .fields()
    .paginate();

  const transactions = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  const totalCommission = await Transaction.aggregate([
    { $match: query },
    { $group: { _id: null, total: { $sum: "$commission" } } },
  ]);

  return {
    meta,
    totalCommission: totalCommission[0]?.total || 0,
    data: transactions,
  };
};

export const TransactionService = {
  createTransaction,
  getMyTransactions,
  getAllTransactions,
  getAgentCommission,
};
