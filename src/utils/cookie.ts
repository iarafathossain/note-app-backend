import { CookieOptions, Request, Response } from "express";

// set cookie
const setCookie = (
  res: Response,
  key: string,
  value: string,
  options: CookieOptions,
) => {
  res.cookie(key, value, options);
};

// Get cookie
const getCookie = (req: Request, key: string) => {
  return req.cookies?.[key];
};

// Clear Cookie
const clearCookie = (res: Response, key: string, options: CookieOptions) => {
  res.clearCookie(key, options);
};

export const cookieUtils = {
  setCookie,
  getCookie,
  clearCookie,
};
