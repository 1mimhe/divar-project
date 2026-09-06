import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  MONGODB_URL: z.string().min(1).default("mongodb://127.0.0.1:27017/divar-store"),
  JWT_PRIVATE_KEY: z.string().min(32, "JWT_PRIVATE_KEY must be at least 32 chars"),
  JWT_REFRESH_KEY: z.string().min(32, "JWT_REFRESH_KEY must be at least 32 chars"),
  COOKIE_PRIVATE_KEY: z.string().min(32, "COOKIE_PRIVATE_KEY must be at least 32 chars"),
  SMS_PROVIDER: z.enum(["mock", "sms"]).default("mock"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Copy .env.example to .env and fill secrets.");
  }
  return parsed.data;
}

export const env: Env = loadEnv();
export const isProd = env.NODE_ENV === "production";
