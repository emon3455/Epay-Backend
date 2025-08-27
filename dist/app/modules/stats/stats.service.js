"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const transaction_model_1 = require("../transaction/transaction.model");
const user_interface_1 = require("../user/user.interface");
const user_model_1 = require("../user/user.model");
const wallet_model_1 = require("../wallet/wallet.model");
const date_1 = require("../../utils/date");
const getSystemSummary = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    // use your date matcher everywhere
    const txMatch = (0, date_1.buildDateMatch)(startDate, endDate);
    const userMatch = (0, date_1.buildDateMatch)(startDate, endDate);
    // 1) Core transaction aggregates
    const coreAgg = transaction_model_1.Transaction.aggregate([
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
    const byStatusAgg = transaction_model_1.Transaction.aggregate([
        { $match: txMatch },
        { $group: { _id: "$status", count: { $count: {} }, amount: { $sum: "$amount" } } },
        { $project: { _id: 0, status: "$_id", count: 1, amount: 1 } },
    ]);
    // 3) Transactions by type
    const byTypeAgg = transaction_model_1.Transaction.aggregate([
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
    const byMethodAgg = transaction_model_1.Transaction.aggregate([
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
    const dailyAgg = transaction_model_1.Transaction.aggregate([
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
    const topAgentsAgg = transaction_model_1.Transaction.aggregate([
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
    const userTotalsAgg = user_model_1.User.aggregate([
        {
            $group: {
                _id: "$role",
                count: { $count: {} },
                active: { $sum: { $cond: ["$isActive", 1, 0] } },
            },
        },
        { $project: { _id: 0, role: "$_id", count: 1, active: 1 } },
    ]);
    const totalUsersAgg = user_model_1.User.countDocuments({});
    const totalAgentsAgg = user_model_1.User.countDocuments({ role: "AGENT" });
    const totalAdminsAgg = user_model_1.User.countDocuments({ role: "ADMIN" });
    const newUsersAgg = user_model_1.User.countDocuments(userMatch);
    const newAgentsAgg = user_model_1.User.countDocuments(Object.assign(Object.assign({}, userMatch), { role: "AGENT" }));
    // 8) Active users in the range (appeared in any tx in the window)
    const activeUsersAgg = transaction_model_1.Transaction.aggregate([
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
    const walletTotalsAgg = wallet_model_1.Wallet.aggregate([
        { $group: { _id: null, totalWalletBalance: { $sum: "$balance" }, walletCount: { $count: {} } } },
        { $project: { _id: 0, totalWalletBalance: 1, walletCount: 1 } },
    ]).catch(() => []); // ok if Wallet collection doesn't exist
    // Run all in parallel
    const [core, byStatus, byType, byMethod, daily, topAgents, userTotals, totalUsers, totalAgents, totalAdmins, newUsers, newAgents, activeUsers, walletTotals,] = yield Promise.all([
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
    const coreRow = (_a = core[0]) !== null && _a !== void 0 ? _a : { totalAmount: 0, totalFees: 0, totalCommission: 0, txCount: 0 };
    const activeUsersCount = (_c = (_b = activeUsers === null || activeUsers === void 0 ? void 0 : activeUsers[0]) === null || _b === void 0 ? void 0 : _b.activeUsers) !== null && _c !== void 0 ? _c : 0;
    const walletRow = (_d = walletTotals === null || walletTotals === void 0 ? void 0 : walletTotals[0]) !== null && _d !== void 0 ? _d : { totalWalletBalance: 0, walletCount: 0 };
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
            byRole: userTotals, // [{ role, count, active }]
            newUsersInRange: newUsers, // createdAt within your date window
            newAgentsInRange: newAgents,
            activeUsersInRange: activeUsersCount,
        },
        transactions: {
            byStatus, // [{ status, count, amount }]
            byType, // [{ type, count, amount, fees, commission }]
            byMethod, // [{ method, count, amount, fees }]
            daily, // [{ date, amount, fees, commission, count }]
            topAgents, // [{ agentId, agentName, agentEmail, commission, txCount }]
        },
    };
});
// 2) Agent commission summary
const getAgentCommissionSummary = (startDate_1, endDate_1, ...args_1) => __awaiter(void 0, [startDate_1, endDate_1, ...args_1], void 0, function* (startDate, endDate, query = {}) {
    // Step 1: paginate agents using your QueryBuilder
    const baseUserQuery = user_model_1.User.find({ role: user_interface_1.Role.AGENT }).select("name email isActive");
    const userQB = new QueryBuilder_1.QueryBuilder(baseUserQuery, query)
        .search(["name", "email"]) // allow ?search=emon or your QB's search param
        .filter()
        .sort()
        .fields()
        .paginate();
    const agents = yield userQB.build();
    const meta = yield userQB.getMeta();
    if (agents.length === 0) {
        return {
            data: [],
            meta,
        };
    }
    // Step 2: aggregate commissions for ONLY the paginated agents
    const agentIds = agents.map((a) => a._id);
    const match = { agent: { $in: agentIds } };
    Object.assign(match, (0, date_1.buildDateMatch)(startDate, endDate));
    const commissionRows = yield transaction_model_1.Transaction.aggregate([
        { $match: match },
        {
            $group: {
                _id: "$agent",
                totalCommission: { $sum: "$commission" },
            },
        },
    ]);
    // Step 3: map totals back to each agent; default 0 if none
    const totalsMap = new Map(commissionRows.map((r) => [String(r._id), Number(r.totalCommission || 0)]));
    const data = agents.map((a) => {
        var _a;
        return ({
            agentId: a._id,
            name: a.name,
            email: a.email,
            isActive: a.isActive,
            totalCommission: (_a = totalsMap.get(String(a._id))) !== null && _a !== void 0 ? _a : 0,
        });
    });
    return { data, meta };
});
// 3) List all transactions that produced system revenue (fee/commission > 0)
const getSystemTransactions = (startDate, endDate) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = {
        $or: [{ fee: { $gt: 0 } }, { commission: { $gt: 0 } }],
    };
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = new Date(startDate);
        if (endDate)
            filter.createdAt.$lte = new Date(endDate);
    }
    const baseQuery = transaction_model_1.Transaction.find();
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, filter)
        .filter()
        .sort()
        .fields()
        .paginate();
    const transactions = yield queryBuilder.build();
    const meta = yield queryBuilder.getMeta();
    return { transactions, meta };
});
exports.StatsService = {
    getSystemSummary,
    getAgentCommissionSummary,
    getSystemTransactions,
};
