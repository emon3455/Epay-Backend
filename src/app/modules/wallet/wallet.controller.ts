import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { WalletService } from "./wallet.service";
import { JwtPayload } from "jsonwebtoken";
import { IsActive } from "../user/user.interface";

export const WalletController = {

  getMyWallet: catchAsync(async (req: Request, res: Response) => {
    const userId = req.params.id;

    const result = await WalletService.getMyWallet(userId);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Wallet retrieved",
      data: result,
    });
  }),

  addMoney: catchAsync(async (req: Request, res: Response) => {
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
  }),

  withdrawMoney: catchAsync(async (req: Request, res: Response) => {
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
  }),

  sendMoney: catchAsync(async (req: Request, res: Response) => {
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
  }),

  agentCashIn: catchAsync(async (req: Request, res: Response) => {
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
  }),

  agentCashOut: catchAsync(async (req: Request, res: Response) => {
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
  }),

  getAllWallets: catchAsync(async (_req: Request, res: Response) => {
    const result = await WalletService.getAllWallets();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All wallets retrieved",
      data: result,
    });
  }),

  blockWallet: catchAsync(async (req: Request, res: Response) => {
    const result = await WalletService.blockWallet(req.params.userId);
    
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Wallet Successfully ${result.isActive === IsActive.ACTIVE ? "Activated" : result.isActive}`,
      data: result,
    });
  }),
};
