import type { Request, Response } from "express";
import status from "http-status";
import AppError from "../../errors/app-error.js";
import { sendResponse } from "../../shared/send-response.js";
import { cookieUtils } from "../../utils/cookie.js";
import { tokenUtils } from "../../utils/token.js";
import {
  loginUser,
  refreshUserSession,
  registerUser,
  revokeRefreshSession,
} from "./auth.service.js";

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, "Authentication required.");
  }

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Current user retrieved successfully.",
    data: {
      user: {
        _id: req.user.userId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    },
  });
};

export const register = async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Registration successful.",
    data: { user: result.user },
  });
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Login successful.",
    data: { user: result.user },
  });
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = cookieUtils.getCookie(req, "refresh_token");
  const result = await refreshUserSession(refreshToken);
  tokenUtils.setAccessTokenCookie(res, result.accessToken);
  tokenUtils.setRefreshTokenCookie(res, result.refreshToken);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Token refreshed successfully.",
    data: { user: result.user },
  });
};

export const logout = async (req: Request, res: Response) => {
  await revokeRefreshSession(cookieUtils.getCookie(req, "refresh_token"));
  tokenUtils.clearAuthCookies(res);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Logout successful.",
  });
};
