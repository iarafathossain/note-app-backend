import type { IRequestUser } from "../interfaces/auth-type.js";

declare global {
  namespace Express {
    interface Request {
      user?: IRequestUser;
    }
  }
}

export {};
