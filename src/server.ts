import { createExpressApp } from "./app.ts";
import { connectDB } from "./config/db.ts";
import { env } from "./config/env.ts";
import { logger } from "./config/logger.ts";

async function main(): Promise<void> {
  const app = createExpressApp();
  app.listen(env.PORT, () => {
    logger.info(`v2 server listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  // DB connects in background so /health works even without mongo in dev.
  // Domain routes (Issue #3) will enforce DB readiness per-request.
  connectDB(env.MONGODB_URL).catch((err) => {
    logger.warn({ err }, "Booting without DB connection (domain routes will 503)");
  });
}

void main();
