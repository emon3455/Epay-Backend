import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { WalletService } from "./wallet.service";
import { JwtPayload } from "jsonwebtoken";
import { IsActive } from "../user/user.interface";

const getMyWallet = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;

  const result = await WalletService.getMyWallet(verifiedToken as JwtPayload);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Wallet retrieved",
    data: result,
  });
});

const addMoney = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;

  const payload = req.body;
  const result = await WalletService.addMoney(
    verifiedToken as JwtPayload,
    payload.amount
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Money added successfully",
    data: result,
  });
});

const withdrawMoney = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;

  const payload = req.body;
  const result = await WalletService.withdrawMoney(
    verifiedToken as JwtPayload,
    payload.amount
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Money withdrawn successfully",
    data: result,
  });
});

const sendMoney = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;

  const payload = req.body;

  const result = await WalletService.sendMoney(
    verifiedToken as JwtPayload,
    payload.receiverEmailOrPhone,
    payload.amount
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Money sent successfully",
    data: result,
  });
});

const agentCashIn = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;
  const payload = req.body;
  const { userId, amount } = payload;
  const result = await WalletService.agentCashIn(
    verifiedToken as JwtPayload,
    userId,
    amount
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Cash-in successful",
    data: result,
  });
});

const agentCashOut = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;
  const payload = req.body;
  const { userId, amount } = payload;
  const result = await WalletService.agentCashOut(
    verifiedToken as JwtPayload,
    userId,
    amount
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Cash-out successful",
    data: result,
  });
});

const getAllWallets = catchAsync(async (req: Request, res: Response) => {
  const result = await WalletService.getAllWallets(req.query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All wallets retrieved",
    meta: result.meta,
    data: result.data,
  });
});

const blockWallet = catchAsync(async (req: Request, res: Response) => {
  const result = await WalletService.blockWallet(req.params.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Wallet Successfully ${
      result.isActive === IsActive.ACTIVE ? "Activated" : result.isActive
    }`,
    data: result,
  });
});

export const WalletController = {
  getMyWallet,
  addMoney,
  withdrawMoney,
  sendMoney,
  agentCashIn,
  agentCashOut,
  getAllWallets,
  blockWallet,
};
