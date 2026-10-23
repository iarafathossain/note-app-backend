import "dotenv/config";

/**
 # JWT
ACCESS_TOKEN_SECRET=replace_with_a_long_random_secret
ACCESS_TOKEN_EXPIRES_IN=15m

REFRESH_TOKEN_SECRET=replace_with_another_long_random_secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Cookie expiration
ACCESS_TOKEN_COOKIE_MAX_AGE=15m
REFRESH_TOKEN_COOKIE_MAX_AGE=7d
 */

interface IEnvConfig {
  DATABASE_URL: string;
  PORT: String;
  NODE_ENV: "development" | "production" | "staging";
  FRONTEND_URL: string;
  ACCESS_TOKEN_SECRET: string;
  ACCESS_TOKEN_EXPIRES_IN: string;
  REFRESH_TOKEN_SECRET: string;
  REFRESH_TOKEN_EXPIRES_IN: string;
  ACCESS_TOKEN_COOKIE_MAX_AGE: string;
  REFRESH_TOKEN_COOKIE_MAX_AGE: string;
}

const loadEnvironmentVariables = (): IEnvConfig => {
  // required environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "PORT",
    "NODE_ENV",
    "FRONTEND_URL",
    "ACCESS_TOKEN_SECRET",
    "ACCESS_TOKEN_EXPIRES_IN",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRES_IN",
    "ACCESS_TOKEN_COOKIE_MAX_AGE",
    "REFRESH_TOKEN_COOKIE_MAX_AGE",
  ];

  requiredEnvVars.forEach((variable) => {
    if (!process.env[variable]?.trim()) {
      throw new Error(
        `Environment variable ${variable} is required but not defined.`,
      );
    }
  });

  if (process.env.ACCESS_TOKEN_SECRET === process.env.REFRESH_TOKEN_SECRET) {
    throw new Error(
      "ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be different.",
    );
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV! as "development" | "production" | "staging",
    FRONTEND_URL: process.env.FRONTEND_URL!,
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET!,
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN!,
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN!,
    ACCESS_TOKEN_COOKIE_MAX_AGE: process.env.ACCESS_TOKEN_COOKIE_MAX_AGE!,
    REFRESH_TOKEN_COOKIE_MAX_AGE: process.env.REFRESH_TOKEN_COOKIE_MAX_AGE!,
  };
};

export const envVariables = loadEnvironmentVariables();
