import argon2 from "argon2";
import status from "http-status";
import type { z } from "zod";
import { envVariables } from "../../config/env.js";
import AppError from "../../errors/app-error.js";
import { jwtUtils } from "../../utils/jwt.js";
import { parseDurationToMs, tokenUtils } from "../../utils/token.js";
import { SessionModel } from "../sessions/session.model.js";
import { UserModel, type UserRole } from "../users/user.model.js";
import type { SafeUser } from "./auth.types.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

const invalidCredentialsError = () =>
  new AppError(status.UNAUTHORIZED, "Invalid email or password.");

const toSafeUser = (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
  interests: string[];
}): SafeUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  interests: user.interests,
});

const createPayload = (
  user: {
    _id: { toString(): string };
    name: string;
    email: string;
    role: UserRole;
  },
  tokenType: "access" | "refresh",
) => ({
  userId: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  tokenType,
});

const createSession = async (userId: string, refreshToken: string) => {
  await SessionModel.create({
    userId,
    refreshTokenHash: await argon2.hash(refreshToken),
    expiresAt: new Date(
      Date.now() + parseDurationToMs(envVariables.REFRESH_TOKEN_EXPIRES_IN),
    ),
  });
};

const issueTokens = async (user: {
  _id: { toString(): string };
  name: string;
  email: string;
  role: UserRole;
}) => {
  const accessToken = tokenUtils.getAccessToken(createPayload(user, "access"));
  const refreshToken = tokenUtils.getRefreshToken(
    createPayload(user, "refresh"),
  );
  await createSession(user._id.toString(), refreshToken);
  return { accessToken, refreshToken };
};

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await UserModel.exists({ email: input.email });
  if (existingUser) {
    throw new AppError(
      status.CONFLICT,
      "An account with this email already exists.",
    );
  }

  try {
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash: await argon2.hash(input.password),
      interests: input.interests ?? [],
    });
    const tokens = await issueTokens(user);
    return { user: toSafeUser(user), ...tokens };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new AppError(
        status.CONFLICT,
        "An account with this email already exists.",
      );
    }
    throw error;
  }
};

export const loginUser = async (input: LoginInput) => {
  const user = await UserModel.findOne({ email: input.email }).select(
    "+passwordHash",
  );
  if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
    throw invalidCredentialsError();
  }

  const tokens = await issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
};

const findSessionForRefreshToken = async (
  userId: string,
  refreshToken: string,
) => {
  const sessions = await SessionModel.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).select("+refreshTokenHash");

  for (const session of sessions) {
    if (await argon2.verify(session.refreshTokenHash, refreshToken)) {
      return session;
    }
  }
  return undefined;
};

export const refreshUserSession = async (refreshToken: string | undefined) => {
  if (!refreshToken) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token.");
  }

  const verification = jwtUtils.verifyToken(
    refreshToken,
    envVariables.REFRESH_TOKEN_SECRET,
  );
  if (
    !verification.success ||
    verification.data.tokenType !== "refresh" ||
    typeof verification.data.userId !== "string"
  ) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token.");
  }

  const session = await findSessionForRefreshToken(
    verification.data.userId,
    refreshToken,
  );
  if (!session) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token.");
  }

  const user = await UserModel.findById(verification.data.userId);
  if (!user) {
    throw new AppError(status.UNAUTHORIZED, "Invalid refresh token.");
  }

  session.revokedAt = new Date();
  await session.save();
  const tokens = await issueTokens(user);
  return { user: toSafeUser(user), ...tokens };
};

export const revokeRefreshSession = async (
  refreshToken: string | undefined,
) => {
  if (!refreshToken) return;

  const verification = jwtUtils.verifyToken(
    refreshToken,
    envVariables.REFRESH_TOKEN_SECRET,
  );
  if (
    !verification.success ||
    verification.data.tokenType !== "refresh" ||
    typeof verification.data.userId !== "string"
  ) {
    return;
  }

  const session = await findSessionForRefreshToken(
    verification.data.userId,
    refreshToken,
  );
  if (session) {
    session.revokedAt = new Date();
    await session.save();
  }
};
