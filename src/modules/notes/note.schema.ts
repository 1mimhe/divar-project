import { z } from "zod";

export const upsertNoteSchema = z.object({
  content: z.string().trim().min(1, "Content is required.").max(2000),
});

export type UpsertNoteDto = z.infer<typeof upsertNoteSchema>;
