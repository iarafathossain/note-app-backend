import type { Request, Response } from "express";
import status from "http-status";
import AppError from "../../errors/app-error.js";
import { sendResponse } from "../../shared/send-response.js";
import { getPaginationMeta } from "../../utils/pagination.js";
import {
  createPost,
  deletePost,
  getPost,
  getUserPosts,
  listPosts,
  updatePost,
} from "./post.service.js";
import type { PostListQuery } from "./post.validation.js";

const getParam = (req: Request, key: string) => {
  const value = req.params[key];
  if (typeof value !== "string") {
    throw new AppError(status.BAD_REQUEST, `Invalid ${key}.`);
  }
  return value;
};

export const create = async (req: Request, res: Response) => {
  const post = await createPost(req.user, req.body);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Post created successfully.",
    data: { post },
  });
};

export const list = async (req: Request, res: Response) => {
  const { page, limit, search } = req.query as unknown as PostListQuery;
  const result = await listPosts(page, limit, search);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Posts retrieved successfully.",
    data: { posts: result.posts },
    meta: getPaginationMeta(page, limit, result.total),
  });
};

export const get = async (req: Request, res: Response) => {
  const post = await getPost(getParam(req, "id"));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Post retrieved successfully.",
    data: { post },
  });
};

export const update = async (req: Request, res: Response) => {
  const post = await updatePost(req.user, getParam(req, "id"), req.body);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Post updated successfully.",
    data: { post },
  });
};

export const remove = async (req: Request, res: Response) => {
  await deletePost(req.user, getParam(req, "id"));
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Post deleted successfully.",
  });
};

export const listUserPosts = async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);
  const result = await getUserPosts(getParam(req, "userId"), page, limit);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "User posts retrieved successfully.",
    data: {
      user: result.user,
      posts: result.posts,
    },
    meta: getPaginationMeta(page, limit, result.total),
  });
};
