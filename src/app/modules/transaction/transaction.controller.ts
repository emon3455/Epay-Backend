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

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionService.getAllTransactions(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All transactions fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getAgentCommission = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user as JwtPayload;

  const result = await TransactionService.getAgentCommission(
    verifiedToken,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Agent commission summary fetched",
    meta: result.meta,
    data: {
      totalCommission: result.totalCommission,
      transactions: result.data,
    },
  });
});

export const TransactionController = {
  getMyTransactions,
  getAllTransactions,
  getAgentCommission,
};
