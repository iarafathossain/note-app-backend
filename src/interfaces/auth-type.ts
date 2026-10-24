import { UserRole } from "../modules/users/user.model.js";

export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  tokenType: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface IRequestUser {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
  createdAt: Date;
}
