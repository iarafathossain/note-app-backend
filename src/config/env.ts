import "dotenv/config";

interface IEnvConfig {
  DATABASE_URL: string;
  PORT: String;
}

const loadEnvironmentVariables = (): IEnvConfig => {
  // required environment variables
  const requiredEnvVars = ["DATABASE_URL", "PORT"];

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
  };
};

export const envVariables = loadEnvironmentVariables();
