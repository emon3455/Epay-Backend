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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = exports.getMyTransactions = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const transaction_service_1 = require("./transaction.service");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
exports.getMyTransactions = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = req.user;
    // filters/pagination (all optional)
    const { page = "1", limit = "20", role, // "SENT" | "RECEIVED" | "AGENT"
    type, // e.g. "SENDMONEY" | "ADDMONEY" | ...
    status, // if you track status
    minAmount, maxAmount, dateFrom, // ISO date string (YYYY-MM-DD)
    dateTo, // ISO date string (YYYY-MM-DD)
    searchTerm, // matches counterparty name/email/phone
     } = req.query;
    const result = yield transaction_service_1.TransactionService.getMyTransactions(verifiedToken, {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        role: role,
        type,
        status,
        minAmount: minAmount ? Number(minAmount) : undefined,
        maxAmount: maxAmount ? Number(maxAmount) : undefined,
        dateFrom,
        dateTo,
        searchTerm,
    });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "My Transaction history fetched",
        data: result.data,
        meta: result.meta,
    });
}));
const getAllTransactions = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield transaction_service_1.TransactionService.getAllTransactions(req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All transactions fetched successfully",
        data: result.data,
        meta: result.meta,
    });
}));
const getAgentCommission = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const agentId = req.query.id;
    const result = yield transaction_service_1.TransactionService.getAgentCommission(agentId, req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Agent commission summary fetched",
        meta: result.meta,
        data: {
            totalCommission: result.totalCommission,
            transactions: result.data,
        },
    });
}));
exports.TransactionController = {
    getMyTransactions: exports.getMyTransactions,
    getAllTransactions,
    getAgentCommission,
};
