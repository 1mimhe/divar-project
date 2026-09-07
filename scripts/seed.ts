import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.ts";
import { env } from "../src/config/env.ts";
import { logger } from "../src/config/logger.ts";
import { Category } from "../src/modules/categories/category.model.ts";
import { User } from "../src/modules/users/user.model.ts";

interface RawCategory {
  _id: { $oid: string };
  name: string;
  slug: string;
  icon: string;
  parents: Array<{ $oid: string } | string>;
}

function toObjectId(raw: { $oid: string } | string): mongoose.Types.ObjectId {
  const hex = typeof raw === "string" ? raw : raw.$oid;
  return new mongoose.Types.ObjectId(hex);
}

/**
 * Seeds root categories from `divar-store.categories.json`, preserving the
 * dumped `_id`s so demo links stay stable. Idempotent: reruns only touch
 * `updatedAt` unless data changed.
 */
async function seedCategories(): Promise<{ upserted: number; modified: number }> {
  const file = path.join(process.cwd(), "divar-store.categories.json");
  const rows = JSON.parse(await fs.readFile(file, "utf8")) as RawCategory[];
  const operations = rows.map((row) => ({
    updateOne: {
      filter: { _id: toObjectId(row._id) },
      update: {
        $set: {
          name: row.name,
          slug: row.slug,
          icon: row.icon,
          parents: row.parents.map(toObjectId),
        },
      },
      upsert: true,
    },
  }));
  const result = await Category.bulkWrite(operations);
  return { upserted: result.upsertedCount, modified: result.modifiedCount };
}

/** Promotes `ADMIN_MOBILE` to admin when the user already exists. */
async function promoteAdmin(): Promise<void> {
  const mobile = process.env.ADMIN_MOBILE;
  if (!mobile) return;
  const user = await User.findOne({ mobile });
  if (!user) {
    logger.warn({ mobile }, "ADMIN_MOBILE set but user not found; log in once, then reseed");
    return;
  }
  user.isAdmin = true;
  await user.save();
  logger.info({ mobile }, "Promoted to admin");
}

async function main(): Promise<void> {
  await connectDB(env.MONGODB_URL);
  try {
    const seeded = await seedCategories();
    logger.info({ ...seeded }, "Categories seeded");
    await promoteAdmin();
  } finally {
    await disconnectDB();
  }
}

void main().catch((err: unknown) => {
  logger.error({ err }, "Seed failed");
  process.exitCode = 1;
});
