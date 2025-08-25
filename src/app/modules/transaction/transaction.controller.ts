import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TransactionService } from "./transaction.service";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";

export const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const verifiedToken = req.user as JwtPayload;

  // filters/pagination (all optional)
  const {
    page = "1",
    limit = "20",
    role,          // "SENT" | "RECEIVED" | "AGENT"
    type,          // e.g. "SENDMONEY" | "ADDMONEY" | ...
    status,        // if you track status
    minAmount,
    maxAmount,
    dateFrom,      // ISO date string (YYYY-MM-DD)
    dateTo,        // ISO date string (YYYY-MM-DD)
    searchTerm,    // matches counterparty name/email/phone
  } = req.query as Record<string, string>;

  const result = await TransactionService.getMyTransactions(
    verifiedToken,
    {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      role: role as "SENT" | "RECEIVED" | "AGENT" | undefined,
      type,
      status,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      dateFrom,
      dateTo,
      searchTerm,
    }
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "My Transaction history fetched",
    data: result.data,
    meta: result.meta,
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
  const agentId = req.query.id as string;

  const result = await TransactionService.getAgentCommission(
    agentId,
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
