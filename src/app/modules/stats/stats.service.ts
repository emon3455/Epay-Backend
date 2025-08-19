/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Transaction } from "../transaction/transaction.model";
import { Role } from "../user/user.interface";
import { User } from "../user/user.model";

const buildDateMatch = (startDate?: string, endDate?: string) => {
  const match: Record<string, any> = {};
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  return match;
};

// 1) System revenue summary
const getSystemSummary = async (startDate?: string, endDate?: string) => {
  const match = buildDateMatch(startDate, endDate);

  const [summary] = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalFees: { $sum: "$fee" },
        totalCommission: { $sum: "$commission" },
        txCount: { $count: {} },
      },
    },
  ]);

  return {
    totalFees: summary?.totalFees ?? 0,
    totalCommission: summary?.totalCommission ?? 0,
    txCount: summary?.txCount ?? 0,
  };
};

// 2) Agent commission summary
const getAgentCommissionSummary = async (
  startDate?: string,
  endDate?: string,
  query: Record<string, string> = {}
) => {
  // Step 1: paginate agents using your QueryBuilder
  const baseUserQuery = User.find({ role: Role.AGENT }).select(
    "name email isActive"
  );
  const userQB = new QueryBuilder(baseUserQuery, query)
    .search(["name", "email" ]) // allow ?search=emon or your QB's search param
    .filter()
    .sort()
    .fields()
    .paginate();

  const agents = await userQB.build();
  const meta = await userQB.getMeta();

  if (agents.length === 0) {
    return {
      data: [],
      meta,
    };
  }

  // Step 2: aggregate commissions for ONLY the paginated agents
  const agentIds = agents.map((a: any) => a._id);
  const match: any = { agent: { $in: agentIds } };
  Object.assign(match, buildDateMatch(startDate, endDate));

  const commissionRows = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$agent",
        totalCommission: { $sum: "$commission" },
      },
    },
  ]);

  // Step 3: map totals back to each agent; default 0 if none
  const totalsMap = new Map<string, number>(
    commissionRows.map((r) => [String(r._id), Number(r.totalCommission || 0)])
  );

  const data = agents.map((a: any) => ({
    agentId: a._id,
    name: a.name,
    email: a.email,
    isActive: a.isActive,
    totalCommission: totalsMap.get(String(a._id)) ?? 0,
  }));

  return { data, meta };
};

// 3) List all transactions that produced system revenue (fee/commission > 0)
const getSystemTransactions = async (startDate?: string, endDate?: string) => {
  const filter: Record<string, any> = {
    $or: [{ fee: { $gt: 0 } }, { commission: { $gt: 0 } }],
  };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const baseQuery = Transaction.find();
  const queryBuilder = new QueryBuilder(baseQuery, filter)
    .filter()
    .sort()
    .fields()
    .paginate();

  const transactions = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return { transactions, meta };
};

export const StatsService = {
  getSystemSummary,
  getAgentCommissionSummary,
  getSystemTransactions,
};
