import type { IRequestUser } from "../../interfaces/auth-type.js";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: IRequestUser["role"];
  interests: string[];
}
