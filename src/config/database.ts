import mongoose from "mongoose";
import { envVariables } from "./env.js";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Stored on globalThis so the cache survives hot reloads (tsx/nodemon)
// and warm invocations in serverless environments.
const globalWithCache = globalThis as typeof globalThis & {
  _mongooseCache?: MongooseCache;
};

const cached: MongooseCache = (globalWithCache._mongooseCache ??= {
  conn: null,
  promise: null,
});

export const connectDB = async (): Promise<typeof mongoose> => {
  // Reuse the existing connection
  if (cached.conn) return cached.conn;

  // Reuse an in-flight connection attempt, or start a new one
  if (!cached.promise) {
    cached.promise = mongoose.connect(envVariables.DATABASE_URL, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null; // allow a retry on the next call
    throw error;
  }

  return cached.conn;
};

export const disconnectDB = async (): Promise<void> => {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
};
