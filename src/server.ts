import { Server } from "http";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/database.js";
import { envVariables } from "./config/env.js";

let server: Server;

const main = async () => {
  try {
    await connectDB();
    console.log("✅Database connected successfully.");

    server = app.listen(envVariables.PORT, () => {
      console.log(`Server is running on port ${envVariables.PORT}`);
    });
  } catch (error) {
    console.error("❌Failed to connect to the database:", error);
    process.exit(1);
  }
};

// Close the HTTP server first, then the DB connection, then exit
const shutdown = async (reason: string, exitCode: number) => {
  console.log(`${reason}: closing HTTP server`);

  const closeServer = () =>
    new Promise<void>((resolve) => {
      if (!server) return resolve();
      server.close(() => {
        console.log("✅HTTP server closed");
        resolve();
      });
    });

  try {
    await closeServer();
    await disconnectDB();
    console.log("✅Database disconnected");
  } catch (err) {
    console.error("❌Error during shutdown:", err);
    exitCode = 1;
  } finally {
    process.exit(exitCode);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM signal received", 0));
process.on("SIGINT", () => shutdown("SIGINT signal received", 0));

process.on("uncaughtException", (err) => {
  console.error("❌Uncaught Exception:", err);
  shutdown("Uncaught exception", 1);
});

main();
