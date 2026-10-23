import "dotenv/config";

interface IEnvConfig {
  DATABASE_URL: string;
  PORT: String;
  NODE_ENV: "development" | "production" | "staging";
  FRONTEND_URL: string;
}

const loadEnvironmentVariables = (): IEnvConfig => {
  // required environment variables
  const requiredEnvVars = ["DATABASE_URL", "PORT", "NODE_ENV", "FRONTEND_URL"];

  requiredEnvVars.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(
        `Environment variable ${variable} is required but not defined.`,
      );
    }
  });

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    PORT: process.env.PORT!,
    NODE_ENV: process.env.NODE_ENV! as "development" | "production" | "staging",
    FRONTEND_URL: process.env.FRONTEND_URL!,
  };
};

export const envVariables = loadEnvironmentVariables();
