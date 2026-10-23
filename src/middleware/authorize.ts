import type { NextFunction, Request, Response } from "express";
import status from "http-status";
import AppError from "../errors/app-error.js";
import { UserRole } from "../modules/users/user.model.js";

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(
        new AppError(status.UNAUTHORIZED, "Authentication required."),
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          status.FORBIDDEN,
          "You do not have permission to perform this action.",
        ),
      );
    }

    return next();
  };
};
