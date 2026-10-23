import { NextFunction, Request, Response } from "express";
import status from "http-status";
import * as zod from "zod";
import { envVariables } from "../config/env.js";
import AppError from "../errors/app-error.js";
import { zodErrorHandler } from "../errors/zod-error-handler.js";
import { IErrorResponse, IErrorSource } from "../interfaces/util-type.js";

export const globalErrorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (envVariables.NODE_ENV === "development") {
    console.error("Global Error:", err);
  }

  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = "Internal Server Error";
  let errorSources: IErrorSource[] = [];
  let stack: string | undefined = undefined;

  if (err instanceof zod.ZodError) {
    const simplifiedError = zodErrorHandler(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = [...simplifiedError.errorSources];
    stack = err.stack;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: "AppError",
        message: err.message,
      },
    ];
    stack = err.stack;
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = err.message;
    errorSources = [
      {
        message: err.message,
        path: "Error",
      },
    ];
    stack = err.stack;
  }

  const errorResponse: IErrorResponse = {
    success: false,
    statusCode,
    message,
    errorSources,
    stack: envVariables.NODE_ENV === "development" ? stack : undefined,
    error: envVariables.NODE_ENV === "development" ? err : undefined,
  };

  res.status(statusCode).json(errorResponse);
};
