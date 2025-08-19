import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { StatsService } from "./stats.service";

const systemSummary = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as {
    startDate?: string;
    endDate?: string;
  };

  const data = await StatsService.getSystemSummary(startDate, endDate);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "System revenue summary retrieved",
    data,
  });
});

const agentCommissionSummary = catchAsync(
  async (req: Request, res: Response) => {
    const { startDate, endDate, ...rest } = req.query as {
      startDate?: string;
      endDate?: string;
      [key: string]: string | undefined;
    };

    const { data, meta } = await StatsService.getAgentCommissionSummary(
      startDate,
      endDate,
      rest as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Agent commission summary retrieved",
      data,
      meta,
    });
  }
);

const systemTransactions = catchAsync(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query as {
    startDate?: string;
    endDate?: string;
  };

  const { transactions: data, meta } = await StatsService.getSystemTransactions(
    startDate,
    endDate
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "System revenue transactions retrieved",
    data,
    meta,
  });
});

export const StatsControllers = {
  systemSummary,
  agentCommissionSummary,
  systemTransactions,
};
