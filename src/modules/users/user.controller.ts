import type { Request, Response } from "express";
import status from "http-status";
import { sendResponse } from "../../shared/send-response.js";
import { getUsersGroupedByInterests } from "./user.service.js";

export const getGroupedByInterests = async (_req: Request, res: Response) => {
  const groups = await getUsersGroupedByInterests();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users grouped by interests retrieved successfully.",
    data: { groups },
  });
};
