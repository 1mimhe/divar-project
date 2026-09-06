import mongoose from "mongoose";
import { logger } from "./logger.ts";

export async function connectDB(uri: string, retries = 5): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri);
      logger.info("MongoDB connected");
      return;
    } catch (err) {
      logger.warn({ attempt, retries }, "MongoDB connection failed, retrying...");
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing MongoDB...");
  await disconnectDB().catch(() => undefined);
});
