import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SystemConfigService } from "./systemConfig.service";

export const getSystemConfig = catchAsync(async (_req: Request, res: Response) => {
  const data = await SystemConfigService.getConfig();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "System config fetched",
    data,
  });
});

export const putSystemConfig = catchAsync(async (req: Request, res: Response) => {
  const data = await SystemConfigService.upsertConfig(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "System config saved",
    data,
  });
});
