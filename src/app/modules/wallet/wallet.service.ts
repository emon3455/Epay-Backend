/* eslint-disable @typescript-eslint/no-non-null-assertion */
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Wallet } from "./wallet.model";
import { User } from "../user/user.model";
import mongoose from "mongoose";
import { IsActive } from "../user/user.interface";
import { JwtPayload } from "jsonwebtoken";

const getMyWallet = async (userId: string) => {
  const wallet = await Wallet.findOne({ user: userId }).populate("user");
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  return wallet;
};

const addMoney = async (decodedToken: JwtPayload, amount: number) => {
  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater then 0");

  const wallet = await Wallet.findOneAndUpdate(
    { user: decodedToken.userId },
    { $inc: { balance: amount } },
    { new: true }
  );
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");

  return wallet;
};

const withdrawMoney = async (decodedToken: JwtPayload, amount: number) => {
  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater then 0");

  const wallet = await Wallet.findOne({ user: decodedToken.userId }).populate(
    "user"
  );
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");
  if (wallet.balance! < amount)
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");

  wallet.balance! -= amount;
  await wallet.save();
  return wallet;
};

const sendMoney = async (
  decodedToken: JwtPayload,
  receiverEmailOrPhone: string,
  amount: number
) => {
  const senderWallet = await Wallet.findOne({ user: decodedToken.userId });
  if (!senderWallet || senderWallet.balance! < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
  }

  const receiverUser = await User.findOne({
    $or: [{ email: receiverEmailOrPhone }, { phone: receiverEmailOrPhone }],
  });
  if (!receiverUser)
    throw new AppError(httpStatus.NOT_FOUND, "Receiver not found");

  const receiverWallet = await Wallet.findOne({ user: receiverUser._id });
  if (!receiverWallet)
    throw new AppError(httpStatus.NOT_FOUND, "Receiver's wallet not found");

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    senderWallet.balance! -= amount;
    receiverWallet.balance! += amount;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });

    await session.commitTransaction();
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
  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater then 0");

  const wallet = await Wallet.findOneAndUpdate(
    { user: userId },
    { $inc: { balance: amount } },
    { new: true }
  );
  if (!wallet) throw new AppError(httpStatus.NOT_FOUND, "Wallet not found");

  return wallet;
};

const agentCashOut = async (
  decodedToken: JwtPayload,
  userId: string,
  amount: number
) => {
  if (amount <= 0)
    throw new AppError(httpStatus.BAD_REQUEST, "Amount must be greater then 0");

  const wallet = await Wallet.findOne({ user: userId });
  if (!wallet || wallet.balance! < amount) {
    throw new AppError(httpStatus.BAD_REQUEST, "Insufficient balance");
  }

  wallet.balance! -= amount;
  await wallet.save();
  return wallet;
};

const getAllWallets = async () => {
  return await Wallet.find().populate("user");
};

const blockWallet = async (userId: string) => {
  const wallet = await Wallet.findOne({ user: userId }).populate("user");
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
