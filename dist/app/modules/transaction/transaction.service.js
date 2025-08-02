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
const transaction_model_1 = require("./transaction.model");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const createTransaction = (data) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.Transaction.create(data);
});
const getMyTransactions = (decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    return yield transaction_model_1.Transaction.find({
        $or: [
            { sender: decodedToken.userId },
            { receiver: decodedToken.userId },
            { agent: decodedToken.userId },
        ],
    }).sort({ createdAt: -1 });
});
const getAllTransactions = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = transaction_model_1.Transaction.find();
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query)
        .filter()
        .sort()
        .fields()
        .paginate();
    const agents = yield queryBuilder.build();
    const meta = yield queryBuilder.getMeta();
    return {
        meta,
        data: agents,
    };
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
    const totalCommission = yield transaction_model_1.Transaction.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$commission" } } },
    ]);
    return {
        meta,
        totalCommission: ((_a = totalCommission[0]) === null || _a === void 0 ? void 0 : _a.total) || 0,
        data: transactions,
    };
});
exports.TransactionService = {
    createTransaction,
    getMyTransactions,
    getAllTransactions,
    getAgentCommission,
};
