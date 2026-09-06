import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { ApiError } from "../../common/errors/ApiError.ts";

/** Web-served upload folder (served from `public`). */
export const UPLOAD_DIR = path.join("public", "uploads");
export const MAX_FILE_BYTES = 3 * 1000 * 1000;

const ALLOWED: ReadonlyMap<string, readonly string[]> = new Map([
  [".png", ["image/png"]],
  [".jpg", ["image/jpeg"]],
  [".jpeg", ["image/jpeg"]],
  [".webp", ["image/webp"]],
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Extension AND mime must agree: blocks `evil.exe` renamed to `.jpg`.
    const ext = path.extname(file.originalname).toLowerCase();
    const mimes = ALLOWED.get(ext);
    if (!mimes || !mimes.includes(file.mimetype)) {
      cb(
        ApiError.badRequest("Files format is not supported. Upload jpg, jpeg, png or webp images."),
        "",
      );
      return;
    }
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

/** Multipart `images` field: up to 10 files, 3 MB each. */
export const upload = multer({ storage, limits: { fileSize: MAX_FILE_BYTES } });

/** Multer disk path → web path (`public/uploads/x` → `/uploads/x`). */
export function toWebPath(diskPath: string): string {
  return `/${path.relative("public", diskPath).split(path.sep).join("/")}`;
}

/** Removes stored files. Stays inside `public`; missing files are ignored. */
export async function deleteUploads(files: string[]): Promise<void> {
  const root = path.resolve("public");
  await Promise.all(
    files.map(async (file) => {
      const disk = path.resolve("public", file.replace(/^\//, ""));
      if (disk === root || !disk.startsWith(root + path.sep)) return;
      try {
        await fs.promises.unlink(disk);
      } catch {
        // Already gone — deletion must stay idempotent.
      }
    }),
  );
}
