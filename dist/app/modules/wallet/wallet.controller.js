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
exports.WalletController = void 0;
const catchAsync_1 = require("../../utils/catchAsync");
const sendResponse_1 = require("../../utils/sendResponse");
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const wallet_service_1 = require("./wallet.service");
const user_interface_1 = require("../user/user.interface");
const getMyWallet = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = req.user;
    const result = yield wallet_service_1.WalletService.getMyWallet(verifiedToken);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Wallet retrieved",
        data: result,
    });
}));
const addMoney = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = req.user;
    const payload = req.body;
    const result = yield wallet_service_1.WalletService.addMoney(verifiedToken, payload.amount);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Money added successfully",
        data: result,
    });
}));
const withdrawMoney = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = req.user;
    const payload = req.body;
    const result = yield wallet_service_1.WalletService.withdrawMoney(verifiedToken, payload.amount);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Money withdrawn successfully",
        data: result,
    });
}));
const sendMoney = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = req.user;
    const payload = req.body;
    const result = yield wallet_service_1.WalletService.sendMoney(verifiedToken, payload.receiverEmailOrPhone, payload.amount);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Money sent successfully",
        data: result,
    });
}));
const agentCashIn = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = req.user;
    const payload = req.body;
    const { userId, amount } = payload;
    const result = yield wallet_service_1.WalletService.agentCashIn(verifiedToken, userId, amount);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cash-in successful",
        data: result,
    });
}));
const agentCashOut = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifiedToken = req.user;
    const payload = req.body;
    const { userId, amount } = payload;
    const result = yield wallet_service_1.WalletService.agentCashOut(verifiedToken, userId, amount);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "Cash-out successful",
        data: result,
    });
}));
const getAllWallets = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield wallet_service_1.WalletService.getAllWallets(req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: "All wallets retrieved",
        meta: result.meta,
        data: result.data,
    });
}));
const blockWallet = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield wallet_service_1.WalletService.blockWallet(req.params.id);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_codes_1.default.OK,
        message: `Wallet Successfully ${result.isActive === user_interface_1.IsActive.ACTIVE ? "Activated" : result.isActive}`,
        data: result,
    });
}));
exports.WalletController = {
    getMyWallet,
    addMoney,
    withdrawMoney,
    sendMoney,
    agentCashIn,
    agentCashOut,
    getAllWallets,
    blockWallet,
};
