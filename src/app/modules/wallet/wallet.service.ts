/* eslint-disable @typescript-eslint/no-non-null-assertion */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Wallet } from "./wallet.model";
import { User } from "../user/user.model";
import mongoose from "mongoose";
import { IsActive } from "../user/user.interface";
import { JwtPayload } from "jsonwebtoken";
import { TransactionService } from "../transaction/transaction.service";
import { TransactionType } from "../transaction/transaction.interface";
import { ensureAgentIsApproved } from "../../helpers/ensureAgentIsApproved";
import { commissionRates } from "../../config/systemConfig";
import { logNotification } from "../../utils/logNotification";
import { getSystemWallet } from "../../utils/getSystemWallet";

const getMyWallet = async (decodedToken: JwtPayload) => {
  const wallet = await Wallet.findOne({ user: decodedToken?.userId }).populate("user");
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  return wallet;
};

const addMoney = async (decodedToken: JwtPayload, amount: number) => {
  const wallet = await Wallet.findOne({ user: decodedToken.userId });
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");

  if (wallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your wallet is currently blocked"
    );
  }

  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");

  wallet.balance! += amount;
  await wallet.save();

  await TransactionService.createTransaction({
    type: TransactionType.ADDMONEY,
    amount,
    receiver: wallet.user,
  });

  logNotification(`Money added to wallet: ${wallet.user}`);

  return wallet;
};

const withdrawMoney = async (decodedToken: JwtPayload, amount: number) => {
  const wallet = await Wallet.findOne({ user: decodedToken.userId }).populate(
    "user"
  );
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  if (wallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your wallet is currently blocked"
    );
  }
  if (wallet.balance! < amount)
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");

  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");

  wallet.balance! -= amount;
  await wallet.save();

  await TransactionService.createTransaction({
    type: TransactionType.WITHDRAWMONEY,
    amount,
    sender: wallet?.user?._id,
  });

  logNotification(`Money withdrawn from wallet: ${wallet.user}`);

  return wallet;
};

const sendMoney = async (
  decodedToken: JwtPayload,
  receiverEmailOrPhone: string,
  amount: number
) => {
  const senderWallet = await Wallet.findOne({ user: decodedToken.userId });
  if (!senderWallet || senderWallet.balance! < amount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Insufficient balance or Wallet not found"
    );
  }

  if (senderWallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your Wallet is currently Blocked"
    );
  }

  const receiverUser = await User.findOne({
    $or: [{ email: receiverEmailOrPhone }, { phone: receiverEmailOrPhone }],
  });
  if (!receiverUser)
    throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");

  const receiverWallet = await Wallet.findOne({ user: receiverUser._id });
  if (!receiverWallet)
    throw new AppError(httpStatus.NOT_FOUND, "Receiver's wallet not found");

  if (receiverWallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Receiver Wallet is currently Blocked"
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {

    if (senderWallet.balance! < amount) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Insufficient balance including fee"
      );
    }

    senderWallet.balance! -= amount;
    receiverWallet.balance! += amount;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });

    await TransactionService.createTransaction({
      type: TransactionType.SENDMONEY,
      amount,
      sender: decodedToken.userId,
      receiver: receiverUser?._id,
      fee:0,
    });

    await session.commitTransaction();
    logNotification(
      `Money sent from ${senderWallet.user} to ${receiverUser._id}`
    );
    return { senderWallet, receiverWallet };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const agentCashIn = async (
  decodedToken: JwtPayload,
  userId: string,
  amount: number
) => {
  const agent = await User.findById(decodedToken.userId);
  ensureAgentIsApproved(agent!);

  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");

  const agentWallet = await Wallet.findOne({ user: agent?._id });
  if (!agentWallet || agentWallet.balance! < amount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Agent has insufficient balance"
    );
  }

  const userWallet = await Wallet.findOne({ user: userId });
  if (!userWallet)
    throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
  if (userWallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User wallet is currently blocked"
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const fee = amount * commissionRates.agentCashIn;
    const netAmount = amount - fee;

    agentWallet.balance! -= amount;
    userWallet.balance! += netAmount;

    const systemWallet = await getSystemWallet();
    systemWallet.balance! += fee;

    await agentWallet.save({ session });
    await userWallet.save({ session });
    await systemWallet.save({ session });

    await TransactionService.createTransaction({
      type: TransactionType.CASHIN,
      amount,
      agent: agent?._id,
      receiver: userWallet.user,
      fee,
    });

    await session.commitTransaction();
    logNotification(`Agent ${agent?._id} cashed in to ${userWallet.user}`);
    return userWallet;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const agentCashOut = async (
  decodedToken: JwtPayload,
  userId: string,
  amount: number
) => {
  const agent = await User.findById(decodedToken.userId);
  ensureAgentIsApproved(agent!);

  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");

  const userWallet = await Wallet.findOne({ user: userId });
  if (!userWallet || userWallet.balance! < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "User has insufficient balance");
  }

  if (userWallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "User wallet is currently blocked"
    );
  }

  const agentWallet = await Wallet.findOne({ user: agent?._id });
  if (!agentWallet) {
    throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const fee = amount * commissionRates.agentCashOut;
    const netAmount = amount - fee;

    userWallet.balance! -= amount;
    agentWallet.balance! += netAmount;

    const systemWallet = await getSystemWallet();
    systemWallet.balance! += fee;

    await userWallet.save({ session });
    await agentWallet.save({ session });
    await systemWallet.save({ session });

    await TransactionService.createTransaction({
      type: TransactionType.CASHOUT,
      amount,
      agent: agent?._id,
      sender: userWallet.user,
      fee,
    });

    await session.commitTransaction();
    logNotification(`Agent ${agent?._id} cashed out from ${userWallet.user}`);
    return userWallet;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getAllWallets = async () => {
  return await Wallet.find().populate("user");
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const blockWallet = async (id: any) => {
  const wallet = await Wallet.findById({ id: id }).populate("user");
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");

  wallet.isActive =
    wallet.isActive === IsActive.BLOCKED ? IsActive.ACTIVE : IsActive.BLOCKED;
  await wallet.save();
  return wallet;
};

export const WalletService = {
  getMyWallet,
  addMoney,
  withdrawMoney,
  sendMoney,
  agentCashIn,
  agentCashOut,
  getAllWallets,
  blockWallet,
};
