/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Transaction } from "../transaction/transaction.model";
import { Role } from "../user/user.interface";
import { User } from "../user/user.model";
import { Wallet } from "../wallet/wallet.model";
import { buildDateMatch } from "../../utils/date";

const getSystemSummary = async (startDate?: string, endDate?: string) => {
    // use your date matcher everywhere
    const txMatch = buildDateMatch(startDate, endDate);
    const userMatch = buildDateMatch(startDate, endDate);

    // 1) Core transaction aggregates
    const coreAgg = Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalFees: { $sum: "$fee" },
          totalCommission: { $sum: "$commission" },
          txCount: { $count: {} },
        },
      },
      {
        $project: {
          _id: 0,
          totalAmount: { $ifNull: ["$totalAmount", 0] },
          totalFees: { $ifNull: ["$totalFees", 0] },
          totalCommission: { $ifNull: ["$totalCommission", 0] },
          txCount: { $ifNull: ["$txCount", 0] },
        },
      },
    ]);

    // 2) Transactions by status
    const byStatusAgg = Transaction.aggregate([
      { $match: txMatch },
      { $group: { _id: "$status", count: { $count: {} }, amount: { $sum: "$amount" } } },
      { $project: { _id: 0, status: "$_id", count: 1, amount: 1 } },
    ]);

    // 3) Transactions by type
    const byTypeAgg = Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: "$type",
          count: { $count: {} },
          amount: { $sum: "$amount" },
          fees: { $sum: "$fee" },
          commission: { $sum: "$commission" },
        },
      },
      { $project: { _id: 0, type: "$_id", count: 1, amount: 1, fees: 1, commission: 1 } },
    ]);

    // 4) Transactions by method
    const byMethodAgg = Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: "$method",
          count: { $count: {} },
          amount: { $sum: "$amount" },
          fees: { $sum: "$fee" },
        },
      },
      { $project: { _id: 0, method: "$_id", count: 1, amount: 1, fees: 1 } },
    ]);

    // 5) Daily time series
    const dailyAgg = Transaction.aggregate([
      { $match: txMatch },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          amount: { $sum: "$amount" },
          fees: { $sum: "$fee" },
          commission: { $sum: "$commission" },
          count: { $count: {} },
        },
      },
      {
        $project: {
          date: { $dateFromParts: { year: "$_id.y", month: "$_id.m", day: "$_id.d" } },
          amount: 1,
          fees: 1,
          commission: 1,
          count: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    // 6) Top earning agents
    const topAgentsAgg = Transaction.aggregate([
      { $match: txMatch },
      { $match: { agentId: { $exists: true, $ne: null } } },
      { $group: { _id: "$agentId", commission: { $sum: "$commission" }, txCount: { $count: {} } } },
      { $sort: { commission: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      { $unwind: { path: "$agent", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          agentId: "$_id",
          agentName: "$agent.name",
          agentEmail: "$agent.email",
          commission: 1,
          txCount: 1,
        },
      },
    ]);

    // 7) Users (totals + by role) and new within range
    const userTotalsAgg = User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $count: {} },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
        },
      },
      { $project: { _id: 0, role: "$_id", count: 1, active: 1 } },
    ]);

    const totalUsersAgg = User.countDocuments({});
    const totalAgentsAgg = User.countDocuments({ role: "AGENT" });
    const totalAdminsAgg = User.countDocuments({ role: "ADMIN" });

    const newUsersAgg = User.countDocuments(userMatch);
    const newAgentsAgg = User.countDocuments({ ...userMatch, role: "AGENT" });

    // 8) Active users in the range (appeared in any tx in the window)
    const activeUsersAgg = Transaction.aggregate([
      { $match: txMatch },
      {
        $project: {
          ids: [
            { $ifNull: ["$fromUser", null] },
            { $ifNull: ["$toUser", null] },
          ],
        },
      },
      { $unwind: "$ids" },
      { $match: { ids: { $ne: null } } },
      { $group: { _id: "$ids" } },
      { $count: "activeUsers" },
    ]);

    // 9) Wallet totals (if you have Wallets)
    const walletTotalsAgg = Wallet.aggregate([
      { $group: { _id: null, totalWalletBalance: { $sum: "$balance" }, walletCount: { $count: {} } } },
      { $project: { _id: 0, totalWalletBalance: 1, walletCount: 1 } },
    ]).catch(() => []); // ok if Wallet collection doesn't exist

    // Run all in parallel
    const [
      core,
      byStatus,
      byType,
      byMethod,
      daily,
      topAgents,
      userTotals,
      totalUsers,
      totalAgents,
      totalAdmins,
      newUsers,
      newAgents,
      activeUsers,
      walletTotals,
    ] = await Promise.all([
      coreAgg,
      byStatusAgg,
      byTypeAgg,
      byMethodAgg,
      dailyAgg,
      topAgentsAgg,
      userTotalsAgg,
      totalUsersAgg,
      totalAgentsAgg,
      totalAdminsAgg,
      newUsersAgg,
      newAgentsAgg,
      activeUsersAgg,
      walletTotalsAgg,
    ]);

    const coreRow = core[0] ?? { totalAmount: 0, totalFees: 0, totalCommission: 0, txCount: 0 };
    const activeUsersCount = activeUsers?.[0]?.activeUsers ?? 0;
    const walletRow = (walletTotals as any[])?.[0] ?? { totalWalletBalance: 0, walletCount: 0 };

    // Final payload
    return {
      range: {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null, // note: inclusive per your matcher
      },
      totals: {
        totalUsers,
        totalAgents,
        totalAdmins,
        totalTransactions: coreRow.txCount,
        totalAmount: coreRow.totalAmount,
        totalFees: coreRow.totalFees,
        totalCommission: coreRow.totalCommission,
        totalWalletBalance: walletRow.totalWalletBalance,
        walletCount: walletRow.walletCount,
      },
      users: {
        byRole: userTotals,        // [{ role, count, active }]
        newUsersInRange: newUsers, // createdAt within your date window
        newAgentsInRange: newAgents,
        activeUsersInRange: activeUsersCount,
      },
      transactions: {
        byStatus,   // [{ status, count, amount }]
        byType,     // [{ type, count, amount, fees, commission }]
        byMethod,   // [{ method, count, amount, fees }]
        daily,      // [{ date, amount, fees, commission, count }]
        topAgents,  // [{ agentId, agentName, agentEmail, commission, txCount }]
      },
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
