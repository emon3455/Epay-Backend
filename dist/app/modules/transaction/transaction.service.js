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
exports.TransactionService = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const transaction_model_1 = require("./transaction.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const mongoose_1 = require("mongoose");
const user_model_1 = require("../user/user.model");
// helpers
const startOfDay = (s) => new Date(new Date(s).setHours(0, 0, 0, 0));
const endOfDay = (s) => new Date(new Date(s).setHours(23, 59, 59, 999));
const toObjectId = (id) => id && mongoose_1.Types.ObjectId.isValid(id) ? new mongoose_1.Types.ObjectId(id) : undefined;
const basePopulate = (q) => q.populate("sender", "name email phone role")
    .populate("receiver", "name email phone role")
    .populate("agent", "name email phone role");
const createTransaction = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.Transaction.create(data);
});
const getMyTransactions = (decodedToken_1, ...args_1) => __awaiter(void 0, [decodedToken_1, ...args_1], void 0, function* (decodedToken, q = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const userId = new mongoose_1.Types.ObjectId(decodedToken.userId);
    const page = (_a = q.page) !== null && _a !== void 0 ? _a : 1;
    const limit = (_b = q.limit) !== null && _b !== void 0 ? _b : 20;
    const skip = (page - 1) * limit;
    // base visibility (sent/received/agent)
    let visibility = { $or: [{ sender: userId }, { receiver: userId }, { agent: userId }] };
    if (q.role === "SENT")
        visibility = { sender: userId };
    if (q.role === "RECEIVED")
        visibility = { receiver: userId };
    if (q.role === "AGENT")
        visibility = { agent: userId };
    // numeric & enum filters
    const match = Object.assign({}, visibility);
    if (q.type)
        match.type = q.type;
    if (q.status)
        match.status = q.status;
    if (q.minAmount != null || q.maxAmount != null) {
        match.amount = {};
        if (q.minAmount != null)
            match.amount.$gte = q.minAmount;
        if (q.maxAmount != null)
            match.amount.$lte = q.maxAmount;
    }
    if (q.dateFrom || q.dateTo) {
        match.createdAt = {};
        if (q.dateFrom)
            match.createdAt.$gte = new Date(`${q.dateFrom}T00:00:00.000Z`);
        if (q.dateTo)
            match.createdAt.$lte = new Date(`${q.dateTo}T23:59:59.999Z`);
    }
    // aggregate so we can search on counterparty name/email/phone
    const pipeline = [
        { $match: match },
        { $sort: { createdAt: -1 } },
        // lookups
        { $lookup: { from: user_model_1.User.collection.name, localField: "sender", foreignField: "_id", as: "senderUser" } },
        { $lookup: { from: user_model_1.User.collection.name, localField: "receiver", foreignField: "_id", as: "receiverUser" } },
        { $lookup: { from: user_model_1.User.collection.name, localField: "agent", foreignField: "_id", as: "agentUser" } },
        { $addFields: {
                senderUser: { $first: "$senderUser" },
                receiverUser: { $first: "$receiverUser" },
                agentUser: { $first: "$agentUser" },
            }
        },
    ];
    if (q.searchTerm && q.searchTerm.trim()) {
        const rx = new RegExp(q.searchTerm.trim(), "i");
        pipeline.push({
            $match: {
                $or: [
                    { "senderUser.name": rx }, { "senderUser.email": rx }, { "senderUser.phone": rx },
                    { "receiverUser.name": rx }, { "receiverUser.email": rx }, { "receiverUser.phone": rx },
                    { "agentUser.name": rx }, { "agentUser.email": rx }, { "agentUser.phone": rx },
                    { reference: rx }, // optional text fields if exist
                    { note: rx },
                ],
            },
        });
    }
    // paginate
    pipeline.push({
        $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            total: [{ $count: "count" }],
        },
    });
    const out = yield transaction_model_1.Transaction.aggregate(pipeline);
    const data = (_d = (_c = out === null || out === void 0 ? void 0 : out[0]) === null || _c === void 0 ? void 0 : _c.data) !== null && _d !== void 0 ? _d : [];
    const total = (_h = (_g = (_f = (_e = out === null || out === void 0 ? void 0 : out[0]) === null || _e === void 0 ? void 0 : _e.total) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.count) !== null && _h !== void 0 ? _h : 0;
    return {
        data,
        meta: { page, limit, total },
    };
});
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
const getAllTransactions = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc", sort, type, sender, receiver, agent, startDate, endDate, amountMin, amountMax, fields, search, searchTerm, } = query;
    const p = Math.max(1, Number(page));
    const l = Math.max(1, Number(limit));
    const skip = (p - 1) * l;
    // ---- build Mongo filter ----
    const filter = {};
    if (type)
        filter.type = type;
    const senderId = toObjectId(sender);
    const receiverId = toObjectId(receiver);
    const agentId = toObjectId(agent);
    if (senderId)
        filter.sender = senderId;
    if (receiverId)
        filter.receiver = receiverId;
    if (agentId)
        filter.agent = agentId;
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate)
            filter.createdAt.$gte = startOfDay(startDate);
        if (endDate)
            filter.createdAt.$lte = endOfDay(endDate);
    }
    if (amountMin || amountMax) {
        filter.amount = {};
        if (amountMin)
            filter.amount.$gte = Number(amountMin);
        if (amountMax)
            filter.amount.$lte = Number(amountMax);
    }
    // party search across sender/receiver/agent (by User.name/email/phone)
    const term = search !== null && search !== void 0 ? search : searchTerm;
    if (term) {
        const re = new RegExp(term, "i");
        const users = yield user_model_1.User.find({
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
            { sender: { $in: ids } },
            { receiver: { $in: ids } },
            { agent: { $in: ids } },
        ];
    }
    // ---- sorting ----
    let sortSpec = "-createdAt";
    if (sort) {
        sortSpec = sort; // raw string, e.g., "amount" or "-amount"
    }
    else if (sortBy) {
        sortSpec = { [sortBy]: sortOrder.toLowerCase() === "asc" ? 1 : -1 };
    }
    // ---- base query (with populate) ----
    let q = basePopulate(transaction_model_1.Transaction.find(filter))
        .sort(sortSpec)
        .skip(skip)
        .limit(l);
    // ---- projection ----
    if (fields)
        q = q.select(fields.split(",").join(" "));
    // ---- execute & count ----
    const [data, total] = yield Promise.all([
        q.lean(),
        transaction_model_1.Transaction.countDocuments(filter),
    ]);
    const meta = {
        page: p,
        limit: l,
        total,
        totalPage: Math.max(1, Math.ceil(total / l)),
    };
    return { data, meta };
});
const getAgentCommission = (agentId, query) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const modifiedQuery = Object.assign(Object.assign({}, query), { agent: agentId });
    const baseQuery = transaction_model_1.Transaction.find();
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, modifiedQuery)
        .filter()
        .sort()
        .fields()
        .paginate();
    const transactions = yield queryBuilder.build();
    const meta = yield queryBuilder.getMeta();
    const listFilter = queryBuilder.modelQuery.getFilter();
    // Option A: aggregation (fast, server-side)
    const agg = yield transaction_model_1.Transaction.aggregate([
        { $match: listFilter },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$commission", 0] } } } },
    ]);
    const totalCommission = ((_a = agg[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
    return {
        meta,
        totalCommission: totalCommission,
        data: transactions
    };
});
exports.TransactionService = {
    createTransaction,
    getMyTransactions,
    getAllTransactions,
    getAgentCommission,
};
