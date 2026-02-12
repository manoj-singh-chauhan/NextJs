import mongoose from "mongoose";
import { logger } from "@/core/logger";

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI as string);
    isConnected = db.connections[0].readyState === 1;

    logger.info("MongoDB Connected");
  } catch (error) {
    logger.error({ error }, "DB Connection Error");

    throw error;
  }
}
