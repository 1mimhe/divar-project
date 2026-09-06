import { z } from "zod";

/** Iranian mobile numbers: 09xxxxxxxxx. Coerces numeric input to string. */
export const mobileSchema = z.coerce
  .string()
  .regex(/^09\d{9}$/, "Mobile must match 09xxxxxxxxx.");

export const sendOtpSchema = z.object({
  mobile: mobileSchema,
});

/** Code coerced to string so JSON numbers (`{code: 12345}`) don't false-negative. */
export const checkOtpSchema = z.object({
  mobile: mobileSchema,
  code: z.coerce.string().regex(/^\d{5}$/, "Code must be 5 digits."),
});

export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type CheckOtpDto = z.infer<typeof checkOtpSchema>;
