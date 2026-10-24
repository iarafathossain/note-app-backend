import type { Request, Response } from "express";
import status from "http-status";
import AppError from "../../errors/app-error.js";
import { sendResponse } from "../../shared/send-response.js";
import { getPaginationMeta } from "../../utils/pagination.js";
import {
  createUser,
  deleteUser,
  getUsersGroupedByInterests,
  listUsers,
  updateUser,
} from "./user.service.js";
import type { UserListQuery } from "./user.validation.js";

const getUserId = (req: Request) => {
  const { id } = req.params;
  if (typeof id !== "string") {
    throw new AppError(status.BAD_REQUEST, "A valid user ID is required.");
  }
  return id;
};

export const list = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as unknown as UserListQuery;
  const result = await listUsers(req.user!.userId, page, limit, search);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users retrieved successfully.",
    data: { users: result.users },
    meta: getPaginationMeta(page, limit, result.total),
  });
};

export const create = async (req: Request, res: Response) => {
  const user = await createUser(req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "User created successfully.",
    data: { user },
  });
};

export const update = async (req: Request, res: Response) => {
  const user = await updateUser(getUserId(req), req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User updated successfully.",
    data: { user },
  });
};

export const remove = async (req: Request, res: Response) => {
  await deleteUser(getUserId(req));

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User deleted successfully.",
  });
};

export const getGroupedByInterests = async (_req: Request, res: Response) => {
  const groups = await getUsersGroupedByInterests();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Users grouped by interests retrieved successfully.",
    data: { groups },
  });
};
