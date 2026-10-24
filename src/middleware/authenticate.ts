import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import AppError from "../errors/app-error.js";
import { envVariables } from "../config/env.js";
import { cookieUtils } from "../utils/cookie.js";
import { jwtUtils } from "../utils/jwt.js";
import { UserModel } from "../modules/users/user.model.js";

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = cookieUtils.getCookie(req, "access_token");
    const verification = token
      ? jwtUtils.verifyToken(token, envVariables.ACCESS_TOKEN_SECRET)
      : { success: false as const, error: "Missing access token" };

    if (
      !verification.success ||
      verification.data.tokenType !== "access" ||
      typeof verification.data.userId !== "string"
    ) {
      throw new AppError(status.UNAUTHORIZED, "Authentication required.");
    }

    const user = await UserModel.findById(verification.data.userId);
    if (!user) {
      throw new AppError(status.UNAUTHORIZED, "Authentication required.");
    }

    req.user = {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
    next();
  } catch (error) {
    next(error);
  }
};