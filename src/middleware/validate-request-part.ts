import type {
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from "express";
import type { ZodObject } from "zod";

type RequestPart = "params" | "query";

export const validateRequestPart = (
  source: RequestPart,
  schema: ZodObject,
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }

    Object.assign(req[source], result.data);
    return next();
  };
};
