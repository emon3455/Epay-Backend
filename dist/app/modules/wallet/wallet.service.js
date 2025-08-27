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
// import { commissionRates } from "../../config/systemConfig";
const logNotification_1 = require("../../utils/logNotification");
const getSystemWallet_1 = require("../../utils/getSystemWallet");
const QueryBuilder_1 = require("../../utils/QueryBuilder");
const getRates_1 = require("../../config/getRates");
const getMyWallet = (decodedToken) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOne({ user: decodedToken === null || decodedToken === void 0 ? void 0 : decodedToken.userId }).populate("user");
    if (!wallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    return wallet;
});
const addMoney = (id, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const wallet = yield wallet_model_1.Wallet.findOne({ user: id });
    if (!wallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Wallet not found");
    if (wallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Receiver wallet is currently blocked");
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
const withdrawMoney = (decodedToken, amount, agentId) => __awaiter(void 0, void 0, void 0, function* () {
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    }
    if (!agentId) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "agentId is required");
    }
    // Load user, agent, wallets
    const [user, agent] = yield Promise.all([
        user_model_1.User.findById(decodedToken.userId),
        user_model_1.User.findById(agentId),
    ]);
    if (!user)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User not found");
    if (!agent)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent not found");
    const [userWallet, agentWallet] = yield Promise.all([
        wallet_model_1.Wallet.findOne({ user: user._id }),
        wallet_model_1.Wallet.findOne({ user: agent._id }),
    ]);
    if (!userWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
    if (!agentWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
    if (userWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Your wallet is currently blocked");
    }
    if (agentWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent wallet is currently blocked");
    }
    const { userWithdrawRate } = yield (0, getRates_1.getRates)();
    const fee = amount * userWithdrawRate;
    const totalDebit = amount + fee;
    if (userWallet.balance < totalDebit) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Insufficient balance");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const systemWallet = yield (0, getSystemWallet_1.getSystemWallet)();
        // Move funds: user -> agent, fee -> system
        userWallet.balance -= totalDebit; // amount + fee
        agentWallet.balance += amount; // agent receives cash amount
        systemWallet.balance += fee; // system collects fee
        yield userWallet.save({ session });
        yield agentWallet.save({ session });
        yield systemWallet.save({ session });
        yield transaction_service_1.TransactionService.createTransaction({
            type: transaction_interface_1.TransactionType.WITHDRAWMONEY,
            amount,
            sender: userWallet.user, // user is payer
            agent: agent._id, // serviced by agent
            fee,
            commission: fee, // system revenue
        });
        yield session.commitTransaction();
        return userWallet;
    }
    catch (e) {
        yield session.abortTransaction();
        throw e;
    }
    finally {
        session.endSession();
    }
});
const sendMoney = (decodedToken, receiverEmailOrPhone, amount) => __awaiter(void 0, void 0, void 0, function* () {
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    }
    const rates = yield (0, getRates_1.getRates)();
    const fee = amount * rates.userSendMoneyRate;
    const totalDebit = amount + fee;
    const senderWallet = yield wallet_model_1.Wallet.findOne({ user: decodedToken.userId });
    if (!senderWallet || senderWallet.balance < totalDebit) {
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
        const systemWallet = yield (0, getSystemWallet_1.getSystemWallet)();
        // Balance updates
        senderWallet.balance -= totalDebit; // amount + fee
        receiverWallet.balance += amount; // receiver gets the full amount
        systemWallet.balance += fee; // system collects the fee
        yield senderWallet.save({ session });
        yield receiverWallet.save({ session });
        yield systemWallet.save({ session });
        yield transaction_service_1.TransactionService.createTransaction({
            type: transaction_interface_1.TransactionType.SENDMONEY,
            amount,
            sender: decodedToken.userId,
            receiver: receiverUser._id,
            fee,
            commission: fee, // track as commission to the system if you like
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
    const rates = yield (0, getRates_1.getRates)();
    const fee = amount * rates.agentCashInRate;
    const netAmount = amount - fee;
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
        const systemWallet = yield (0, getSystemWallet_1.getSystemWallet)();
        agentWallet.balance -= amount;
        userWallet.balance += netAmount;
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
const agentCashOut = (decodedToken, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const agent = yield user_model_1.User.findById(decodedToken.userId);
    (0, ensureAgentIsApproved_1.ensureAgentIsApproved)(agent);
    if (amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    }
    const agentWallet = yield wallet_model_1.Wallet.findOne({ user: agent === null || agent === void 0 ? void 0 : agent._id });
    if (!agentWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
    if (agentWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent wallet is currently blocked");
    }
    if (agentWallet.balance < amount) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Agent has insufficient balance");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const systemWallet = yield (0, getSystemWallet_1.getSystemWallet)();
        // Settlement: agent -> system
        agentWallet.balance -= amount;
        systemWallet.balance += amount;
        yield agentWallet.save({ session });
        yield systemWallet.save({ session });
        // Log as CASHOUT (no fee; fee already charged on the user's withdrawal)
        yield transaction_service_1.TransactionService.createTransaction({
            type: transaction_interface_1.TransactionType.CASHOUT,
            amount,
            agent: agent._id,
            receiver: systemWallet.user, // if your system wallet has a linked user id
            fee: 0,
            commission: 0,
        });
        yield session.commitTransaction();
        return agentWallet;
    }
    catch (e) {
        yield session.abortTransaction();
        throw e;
    }
    finally {
        session.endSession();
    }
});
const agentWithdraw = (decodedToken, userId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const agent = yield user_model_1.User.findById(decodedToken.userId);
    (0, ensureAgentIsApproved_1.ensureAgentIsApproved)(agent);
    if (!Number.isFinite(amount) || amount <= 0) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "Amount must be greater than 0");
    }
    const [agentWallet, userWallet] = yield Promise.all([
        wallet_model_1.Wallet.findOne({ user: agent === null || agent === void 0 ? void 0 : agent._id }),
        wallet_model_1.Wallet.findOne({ user: userId }),
    ]);
    if (!agentWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "Agent wallet not found");
    if (agentWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "Agent wallet is currently blocked");
    }
    if (!userWallet)
        throw new AppError_1.default(http_status_codes_1.default.NOT_FOUND, "User wallet not found");
    if (userWallet.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.default.FORBIDDEN, "User wallet is currently blocked");
    }
    // fees
    const rates = yield (0, getRates_1.getRates)(); // { agentCashOutRate: number, ... }
    const feeRate = Number((_a = rates === null || rates === void 0 ? void 0 : rates.agentCashOutRate) !== null && _a !== void 0 ? _a : 0);
    const fee = +(amount * feeRate).toFixed(2);
    const totalDebit = +(amount + fee).toFixed(2);
    // user must cover amount + fee
    if (((_b = userWallet.balance) !== null && _b !== void 0 ? _b : 0) < totalDebit) {
        throw new AppError_1.default(http_status_codes_1.default.BAD_REQUEST, "User has insufficient balance (amount + fee)");
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const systemWallet = yield (0, getSystemWallet_1.getSystemWallet)();
        // user → debit (amount+fee), agent → credit (amount), system → fee
        userWallet.balance -= totalDebit;
        agentWallet.balance += amount;
        systemWallet.balance += fee;
        yield userWallet.save({ session });
        yield agentWallet.save({ session });
        yield systemWallet.save({ session });
        // record CASHOUT with proper parties
        yield transaction_service_1.TransactionService.createTransaction({
            type: transaction_interface_1.TransactionType.WITHDRAWMONEY,
            amount,
            agent: agent._id,
            sender: userWallet.user,
            receiver: agentWallet.user,
            fee,
            commission: fee,
        });
        yield session.commitTransaction();
        (0, logNotification_1.logNotification)(`Agent ${agent === null || agent === void 0 ? void 0 : agent._id} cash-out from ${userWallet.user} amount ${amount}`);
        return { userWallet, agentWallet };
    }
    catch (e) {
        yield session.abortTransaction();
        throw e;
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
    agentWithdraw
};
