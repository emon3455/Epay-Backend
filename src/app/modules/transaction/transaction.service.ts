/* eslint-disable @typescript-eslint/no-explicit-any */
import { Transaction } from "./transaction.model";
import { ITransaction } from "./transaction.interface";
import { JwtPayload } from "jsonwebtoken";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IGenericResponse } from "../../interfaces/common";
import { Types } from "mongoose";
import { User } from "../user/user.model";


// helpers
const startOfDay = (s: string) => new Date(new Date(s).setHours(0, 0, 0, 0));
const endOfDay   = (s: string) => new Date(new Date(s).setHours(23, 59, 59, 999));
const toObjectId = (id?: string) =>id && Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;

const basePopulate = (q: ReturnType<typeof Transaction.find>) =>
  q.populate("sender", "name email phone role")
   .populate("receiver", "name email phone role")
   .populate("agent", "name email phone role");

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

// const getAllTransactions = async (
//   query: Record<string, string>
// ): Promise<IGenericResponse<ITransaction[]>> => {
//   const baseQuery = Transaction.find();

//   const queryBuilder = new QueryBuilder(baseQuery, query)
//     .filter()
//     .sort()
//     .fields()
//     .paginate();

//   const agents = await queryBuilder.build();
//   const meta = await queryBuilder.getMeta();

//   return {
//     meta,
//     data: agents,
//   };
// };

const getAllTransactions = async (
  query: Record<string, string>
): Promise<IGenericResponse<ITransaction[]>> => {
  const {
    page = "1",
    limit = "10",
    sortBy = "createdAt",
    sortOrder = "desc",
    sort,
    type,
    sender,
    receiver,
    agent,
    startDate,
    endDate,
    amountMin,
    amountMax,
    fields,
    search,
    searchTerm,
  } = query;

  const p = Math.max(1, Number(page));
  const l = Math.max(1, Number(limit));
  const skip = (p - 1) * l;

  // ---- build Mongo filter ----
  const filter: Record<string, any> = {};

  if (type) filter.type = type;

  const senderId = toObjectId(sender);
  const receiverId = toObjectId(receiver);
  const agentId = toObjectId(agent);
  if (senderId)  filter.sender  = senderId;
  if (receiverId) filter.receiver = receiverId;
  if (agentId)   filter.agent   = agentId;

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = startOfDay(startDate);
    if (endDate)   filter.createdAt.$lte = endOfDay(endDate);
  }

  if (amountMin || amountMax) {
    filter.amount = {};
    if (amountMin) filter.amount.$gte = Number(amountMin);
    if (amountMax) filter.amount.$lte = Number(amountMax);
  }

  // party search across sender/receiver/agent (by User.name/email/phone)
  const term = search ?? searchTerm;
  if (term) {
    const re = new RegExp(term, "i");
    const users = await User.find({
      $or: [{ name: re }, { email: re }, { phone: re }],
    }).select("_id");

    const ids = users.map((u) => u._id);
    if (ids.length === 0) {
      // nothing matches → return empty page fast
      return {
        data: [],
        meta: { page: p, limit: l, total: 0, totalPage: 1 },
      };
    }
    filter.$or = [
      { sender:   { $in: ids } },
      { receiver: { $in: ids } },
      { agent:    { $in: ids } },
    ];
  }

  // ---- sorting ----
  let sortSpec: any = "-createdAt";
  if (sort) {
    sortSpec = sort; // raw string, e.g., "amount" or "-amount"
  } else if (sortBy) {
    sortSpec = { [sortBy]: sortOrder.toLowerCase() === "asc" ? 1 : -1 };
  }

  // ---- base query (with populate) ----
  let q = basePopulate(Transaction.find(filter))
    .sort(sortSpec as any)
    .skip(skip)
    .limit(l);

  // ---- projection ----
  if (fields) q = q.select(fields.split(",").join(" "));

  // ---- execute & count ----
  const [data, total] = await Promise.all([
    q.lean(),
    Transaction.countDocuments(filter),
  ]);

  const meta = {
    page: p,
    limit: l,
    total,
    totalPage: Math.max(1, Math.ceil(total / l)),
  };

  return { data, meta };
};

const getAgentCommission = async (
  agentId: string,
  query: Record<string, string>
): Promise<IGenericResponse<ITransaction[]> & { totalCommission: number }> => {
  const modifiedQuery = { ...query, agent: agentId };
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
