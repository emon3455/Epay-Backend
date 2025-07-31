import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TransactionService } from "./transaction.service";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;
  const result = await TransactionService.getMyTransactions(
    verifiedToken as JwtPayload
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transaction history fetched",
    data: result,
  });
});

const getAllTransactions = catchAsync(async (_req: Request, res: Response) => {
  const result = await TransactionService.getAllTransactions();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All transactions fetched",
    data: result,
  });
});

const getAgentCommission = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user;
  const result = await TransactionService.getAgentCommission(
    verifiedToken as JwtPayload
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Agent commission summary fetched",
    data: result,
  });
});

export const TransactionController = {
  getMyTransactions,
  getAllTransactions,
  getAgentCommission,
};
