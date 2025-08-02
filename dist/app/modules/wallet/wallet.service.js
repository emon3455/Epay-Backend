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
exports.WalletService = void 0;
/* eslint-disable @typescript-eslint/no-non-null-assertion */
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const wallet_model_1 = require("./wallet.model");
const user_model_1 = require("../user/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
const user_interface_1 = require("../user/user.interface");
const transaction_service_1 = require("../transaction/transaction.service");
const transaction_interface_1 = require("../transaction/transaction.interface");
const ensureAgentIsApproved_1 = require("../../helpers/ensureAgentIsApproved");
const systemConfig_1 = require("../../config/systemConfig");
const logNotification_1 = require("../../utils/logNotification");
const getSystemWallet_1 = require("../../utils/getSystemWallet");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const getMyWallet = (decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOne({ user: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.userId }).populate("user");
    if (!wallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    return wallet;
});
const addMoney = (decodedToken, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOne({ user: decodedToken.userId });
    if (!wallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    if (wallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Your wallet is currently blocked");
    }
    if (amount <= 0)
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    wallet.balance += amount;
    yield wallet.save();
    yield transaction_service_1.TransactionService.createTransaction({
        type: transaction_interface_1.TransactionType.ADDMONEY,
        amount,
        receiver: wallet.user,
    });
    (0, logNotification_1.logNotification)(`Money added to wallet: ${wallet.user}`);
    return wallet;
});
const withdrawMoney = (decodedToken, amount) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const wallet = yield wallet_model_1.Wallet.findOne({ user: decodedToken.userId }).populate("user");
    if (!wallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    if (wallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Your wallet is currently blocked");
    }
    if (wallet.balance < amount)
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
    if (amount <= 0)
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    wallet.balance -= amount;
    yield wallet.save();
    yield transaction_service_1.TransactionService.createTransaction({
        type: transaction_interface_1.TransactionType.WITHDRAWMONEY,
        amount,
        sender: (_a = wallet === null || wallet === void 0 ? void 0 : wallet.user) === null || _a === void 0 ? void 0 : _a._id,
    });
    (0, logNotification_1.logNotification)(`Money withdrawn from wallet: ${wallet.user}`);
    return wallet;
});
const sendMoney = (decodedToken, receiverEmailOrPhone, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const senderWallet = yield wallet_model_1.Wallet.findOne({ user: decodedToken.userId });
    if (!senderWallet || senderWallet.balance < amount) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance or Wallet not found");
    }
    if (senderWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Your Wallet is currently Blocked");
    }
    const receiverUser = yield user_model_1.User.findOne({
        $or: [{ email: receiverEmailOrPhone }, { phone: receiverEmailOrPhone }],
    });
    if (!receiverUser)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver not found");
    const receiverWallet = yield wallet_model_1.Wallet.findOne({ user: receiverUser._id });
    if (!receiverWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Receiver's wallet not found");
    if (receiverWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Receiver Wallet is currently Blocked");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        if (senderWallet.balance < amount) {
            throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance including fee");
        }
        senderWallet.balance -= amount;
        receiverWallet.balance += amount;
        yield senderWallet.save({ session });
        yield receiverWallet.save({ session });
        yield transaction_service_1.TransactionService.createTransaction({
            type: transaction_interface_1.TransactionType.SENDMONEY,
            amount,
            sender: decodedToken.userId,
            receiver: receiverUser === null || receiverUser === void 0 ? void 0 : receiverUser._id,
            fee: 0,
        });
        yield session.commitTransaction();
        (0, logNotification_1.logNotification)(`Money sent from ${senderWallet.user} to ${receiverUser._id}`);
        return { senderWallet, receiverWallet };
    }
    catch (err) {
        yield session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
    }
});
const agentCashIn = (decodedToken, userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield user_model_1.User.findById(decodedToken.userId);
    (0, ensureAgentIsApproved_1.ensureAgentIsApproved)(agent);
    if (amount <= 0)
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    const agentWallet = yield wallet_model_1.Wallet.findOne({ user: agent === null || agent === void 0 ? void 0 : agent._id });
    if (!agentWallet || agentWallet.balance < amount) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Agent has insufficient balance");
    }
    const userWallet = yield wallet_model_1.Wallet.findOne({ user: userId });
    if (!userWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
    if (userWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User wallet is currently blocked");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const fee = amount * systemConfig_1.commissionRates.agentCashIn;
        const netAmount = amount - fee;
        agentWallet.balance -= amount;
        userWallet.balance += netAmount;
        const systemWallet = yield (0, getSystemWallet_1.getSystemWallet)();
        systemWallet.balance += fee;
        yield agentWallet.save({ session });
        yield userWallet.save({ session });
        yield systemWallet.save({ session });
        yield transaction_service_1.TransactionService.createTransaction({
            type: transaction_interface_1.TransactionType.CASHIN,
            amount,
            agent: agent === null || agent === void 0 ? void 0 : agent._id,
            receiver: userWallet.user,
            fee,
            commission: fee,
        });
        yield session.commitTransaction();
        (0, logNotification_1.logNotification)(`Agent ${agent === null || agent === void 0 ? void 0 : agent._id} cashed in to ${userWallet.user}`);
        return userWallet;
    }
    catch (err) {
        yield session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
    }
});
const agentCashOut = (decodedToken, userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield user_model_1.User.findById(decodedToken.userId);
    (0, ensureAgentIsApproved_1.ensureAgentIsApproved)(agent);
    if (amount <= 0)
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    const userWallet = yield wallet_model_1.Wallet.findOne({ user: userId });
    if (!userWallet || userWallet.balance < amount) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User has insufficient balance");
    }
    if (userWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User wallet is currently blocked");
    }
    const agentWallet = yield wallet_model_1.Wallet.findOne({ user: agent === null || agent === void 0 ? void 0 : agent._id });
    if (!agentWallet) {
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const fee = amount * systemConfig_1.commissionRates.agentCashOut;
        const netAmount = amount - fee;
        userWallet.balance -= amount;
        agentWallet.balance += netAmount;
        const systemWallet = yield (0, getSystemWallet_1.getSystemWallet)();
        systemWallet.balance += fee;
        yield userWallet.save({ session });
        yield agentWallet.save({ session });
        yield systemWallet.save({ session });
        yield transaction_service_1.TransactionService.createTransaction({
            type: transaction_interface_1.TransactionType.CASHOUT,
            amount,
            agent: agent === null || agent === void 0 ? void 0 : agent._id,
            sender: userWallet.user,
            fee,
            commission: fee,
        });
        yield session.commitTransaction();
        (0, logNotification_1.logNotification)(`Agent ${agent === null || agent === void 0 ? void 0 : agent._id} cashed out from ${userWallet.user}`);
        return userWallet;
    }
    catch (err) {
        yield session.abortTransaction();
        throw err;
    }
    finally {
        session.endSession();
    }
});
const getAllWallets = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const baseQuery = wallet_model_1.Wallet.find().populate("user");
    const queryBuilder = new QueryBuilder_1.QueryBuilder(baseQuery, query)
        .filter()
        .sort()
        .fields()
        .paginate();
    const wallet = yield queryBuilder.build();
    const meta = yield queryBuilder.getMeta();
    return {
        data: wallet,
        meta,
    };
});
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockWallet = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findById({ id: id }).populate("user");
    if (!wallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    wallet.isActive =
        wallet.isActive === user_interface_1.IsActive.BLOCKED ? user_interface_1.IsActive.ACTIVE : user_interface_1.IsActive.BLOCKED;
    yield wallet.save();
    return wallet;
});
exports.WalletService = {
    getMyWallet,
    addMoney,
    withdrawMoney,
    sendMoney,
    agentCashIn,
    agentCashOut,
    getAllWallets,
    blockWallet,
};
