import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import { envVariables } from "./config/env.js";
import { globalErrorHandler } from "./middleware/global-error-handler.js";
import { notFoundHandler } from "./middleware/not-found.js";
import { indexRoutes } from "./routes/index.js";

const app: Application = express();

// Configure CORS middleware
app.use(
  cors({
    origin: [envVariables.FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Content-Type", "Authorization", "Cookie", "Set-Cookie"],
  }),
);

// Enable urlencoded body parsing
app.use(express.urlencoded({ extended: true }));

// Enable JSON body parsing with a size limit of 1MB
app.use(express.json({ limit: "1mb" }));

// Parse Cookie header into req.cookies
app.use(cookieParser());

// Use the index routes
app.use("/api/v1", indexRoutes);

// Health check route for cron-job.org
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server is wide awake!" });
});

// Global error handler
app.use(globalErrorHandler);

// not found route handler
app.use(notFoundHandler);

export default app;
