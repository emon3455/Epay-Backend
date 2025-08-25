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
// import { commissionRates } from "../../config/systemConfig";
import { logNotification } from "../../utils/logNotification";
import { getSystemWallet } from "../../utils/getSystemWallet";
import { IGenericResponse } from "../../interfaces/common";
import { IWallet } from "./wallet.interface";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { getRates } from "../../config/getRates";

const getMyWallet = async (decodedToken: JwtPayload) => {
  const wallet = await Wallet.findOne({ user: decodedToken?.userId }).populate(
    "user"
  );
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  return wallet;
};

const addMoney = async (id: string, amount: number) => {
  const wallet = await Wallet.findOne({ user: id });
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");

  if (wallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Receiver wallet is currently blocked"
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

const withdrawMoney = async (
  decodedToken: JwtPayload,
  amount: number,
  agentId: string
) => {
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }
  if (!agentId) {
    throw new AppError(httpStatus.BAD_REQUEST, "agentId is required");
  }

  // Load user, agent, wallets
  const [user, agent] = await Promise.all([
    User.findById(decodedToken.userId),
    User.findById(agentId),
  ]);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");
  if (!agent) throw new AppError(httpStatus.NOT_FOUND, "Agent not found");

  const [userWallet, agentWallet] = await Promise.all([
    Wallet.findOne({ user: user._id }),
    Wallet.findOne({ user: agent._id }),
  ]);
  if (!userWallet)
    throw new AppError(httpStatus.NOT_FOUND, "User wallet not found");
  if (!agentWallet)
    throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");

  if (userWallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Your wallet is currently blocked"
    );
  }
  if (agentWallet.isActive === IsActive.BLOCKED) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Agent wallet is currently blocked"
    );
  }

  const { userWithdrawRate } = await getRates();
  const fee = amount * userWithdrawRate;
  const totalDebit = amount + fee;

  if (userWallet.balance! < totalDebit) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const systemWallet = await getSystemWallet();

    // Move funds: user -> agent, fee -> system
    userWallet.balance! -= totalDebit; // amount + fee
    agentWallet.balance! += amount; // agent receives cash amount
    systemWallet.balance! += fee; // system collects fee

    await userWallet.save({ session });
    await agentWallet.save({ session });
    await systemWallet.save({ session });

    await TransactionService.createTransaction({
      type: TransactionType.WITHDRAWMONEY,
      amount,
      sender: userWallet.user, // user is payer
      agent: agent._id, // serviced by agent
      fee,
      commission: fee, // system revenue
    });

    await session.commitTransaction();
    return userWallet;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

const sendMoney = async (
  decodedToken: JwtPayload,
  receiverEmailOrPhone: string,
  amount: number
) => {
  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }

  const rates = await getRates();
  const fee = amount * rates.userSendMoneyRate;
  const totalDebit = amount + fee;

  const senderWallet = await Wallet.findOne({ user: decodedToken.userId });
  if (!senderWallet || senderWallet.balance! < totalDebit) {
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
    const systemWallet = await getSystemWallet();

    // Balance updates
    senderWallet.balance! -= totalDebit; // amount + fee
    receiverWallet.balance! += amount; // receiver gets the full amount
    systemWallet.balance! += fee; // system collects the fee

    await senderWallet.save({ session });
    await receiverWallet.save({ session });
    await systemWallet.save({ session });

    await TransactionService.createTransaction({
      type: TransactionType.SENDMONEY,
      amount,
      sender: decodedToken.userId,
      receiver: receiverUser._id,
      fee,
      commission: fee, // track as commission to the system if you like
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

  const rates = await getRates();
  const fee = amount * rates.agentCashInRate;
  const netAmount = amount - fee;

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
    const systemWallet = await getSystemWallet();

    agentWallet.balance! -= amount;
    userWallet.balance! += netAmount;
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
      commission: fee,
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
  amount: number
) => {
  const agent = await User.findById(decodedToken.userId);
  ensureAgentIsApproved(agent!);

  if (amount <= 0) {
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater than 0");
  }

  const agentWallet = await Wallet.findOne({ user: agent?._id });
  if (!agentWallet) throw new AppError(httpStatus.NOT_FOUND, "Agent wallet not found");
  if (agentWallet.isActive === IsActive.BLOCKED) {
    throw new AppError(httpStatus.FORBIDDEN, "Agent wallet is currently blocked");
  }
  if (agentWallet.balance! < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Agent has insufficient balance");
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const systemWallet = await getSystemWallet();

    // Settlement: agent -> system
    agentWallet.balance! -= amount;
    systemWallet.balance! += amount;

    await agentWallet.save({ session });
    await systemWallet.save({ session });

    // Log as CASHOUT (no fee; fee already charged on the user's withdrawal)
    await TransactionService.createTransaction({
      type: TransactionType.CASHOUT,
      amount,
      agent: agent!._id,
      receiver: systemWallet.user, // if your system wallet has a linked user id
      fee: 0,
      commission: 0,
    });

    await session.commitTransaction();
    return agentWallet;
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};

const getAllWallets = async (
  query: Record<string, string>
): Promise<IGenericResponse<IWallet[]>> => {
  const baseQuery = Wallet.find().populate("user");

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .filter()
    .sort()
    .fields()
    .paginate();

  const wallet = await queryBuilder.build();
  const meta = await queryBuilder.getMeta();

  return {
    data: wallet,
    meta,
  };
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
