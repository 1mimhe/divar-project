import { env } from "../../config/env.ts";
import { logger } from "../../config/logger.ts";

export interface SendResult {
  /** Exposed only outside production so the demo is usable without a real SMS gateway. */
  previewCode?: string;
}

/** Swap this for a real gateway (Kavenegar, Ghasedak, …) without touching the service. */
export interface SmsProvider {
  sendOtp(mobile: string, code: string): Promise<SendResult>;
}

export class MockSmsProvider implements SmsProvider {
  async sendOtp(mobile: string, code: string): Promise<SendResult> {
    logger.info({ mobile }, "MockSmsProvider: OTP generated (code hidden in production)");
    if (env.NODE_ENV === "production") return {};
    return { previewCode: code };
  }
}

export const smsProvider: SmsProvider = new MockSmsProvider();
