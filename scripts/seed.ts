import fs from "node:fs/promises";
import path from "node:path";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.ts";
import { env } from "../src/config/env.ts";
import { logger } from "../src/config/logger.ts";
import { Category } from "../src/modules/categories/category.model.ts";
import { Option } from "../src/modules/options/option.model.ts";
import { Ad } from "../src/modules/ads/ad.model.ts";
import { User } from "../src/modules/users/user.model.ts";
import { Bookmark } from "../src/modules/bookmarks/bookmark.model.ts";
import { Note } from "../src/modules/notes/note.model.ts";
import { seedUsers, type SeedUser } from "./seed-data/users.ts";
import { seedCategories, type SeedCategory } from "./seed-data/categories.ts";
import { seedOptions, type SeedOption } from "./seed-data/options.ts";
import { seedAds, type SeedAd } from "./seed-data/ads.ts";

function toObjectId(raw: { $oid: string } | string): mongoose.Types.ObjectId {
  const hex = typeof raw === "string" ? raw : raw.$oid;
  return new mongoose.Types.ObjectId(hex);
}

async function seedCategoriesData(): Promise<{ upserted: number; modified: number }> {
  // First pass: create all categories without parent
  const operations = seedCategories.map((cat) => {
    const filter = cat._id ? { _id: toObjectId(cat._id) } : { slug: cat.slug };
    const update: Record<string, unknown> = {
      $set: {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
      },
    };
    return {
      updateOne: {
        filter,
        update,
        upsert: true,
      },
    };
  });

  const result = await Category.bulkWrite(operations);

  // Second pass: update parents by slug
  for (const cat of seedCategories) {
    if (cat.parent) {
      const parent = await Category.findOne({ slug: cat.parent });
      if (parent) {
        await Category.updateOne(
          { slug: cat.slug },
          { $set: { parent: parent._id } }
        );
      }
    }
  }

  return { upserted: result.upsertedCount, modified: result.modifiedCount };
}

async function seedOptionsData(): Promise<{ upserted: number; modified: number }> {
  const operations = [];
  for (const opt of seedOptions) {
    const category = await Category.findOne({ slug: opt.categorySlug });
    if (!category) {
      logger.warn({ categorySlug: opt.categorySlug }, "Category not found for option");
      continue;
    }
    operations.push({
      updateOne: {
        filter: { key: opt.key, category: category._id },
        update: {
          $set: {
            title: opt.title,
            key: opt.key,
            type: opt.type,
            category: category._id,
            required: opt.required ?? false,
            enum: opt.enum ?? [],
            guide: opt.guide,
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length === 0) return { upserted: 0, modified: 0 };
  const result = await Option.bulkWrite(operations);
  return { upserted: result.upsertedCount, modified: result.modifiedCount };
}

async function seedUsersData(): Promise<Map<string, mongoose.Types.ObjectId>> {
  const userIdMap = new Map<string, mongoose.Types.ObjectId>();
  for (const userData of seedUsers) {
    const existing = await User.findOne({ mobile: userData.mobile });
    if (existing) {
      userIdMap.set(userData.mobile, existing._id);
      continue;
    }
    const user = await User.create({
      mobile: userData.mobile,
      fullName: userData.fullName,
      isAdmin: userData.isAdmin ?? false,
      verifiedMobile: true,
    });
    userIdMap.set(userData.mobile, user._id);
    logger.info({ mobile: userData.mobile }, "User created");
  }
  return userIdMap;
}

async function seedAdsData(userIdMap: Map<string, mongoose.Types.ObjectId>): Promise<number> {
  let created = 0;
  for (const adData of seedAds) {
    const category = await Category.findOne({ slug: adData.categorySlug });
    if (!category) {
      logger.warn({ categorySlug: adData.categorySlug }, "Category not found for ad, skipping");
      continue;
    }

    const ownerMobile = seedUsers[created % seedUsers.length].mobile;
    const ownerId = userIdMap.get(ownerMobile);
    if (!ownerId) continue;

    const existing = await Ad.findOne({ title: adData.title, publishedBy: ownerId });
    if (existing) continue;

    const options = new Map<string, unknown>();
    for (const [key, value] of Object.entries(adData.options)) {
      options.set(key, value);
    }

    await Ad.create({
      title: adData.title,
      description: adData.description,
      category: category._id,
      price: adData.price,
      images: adData.images,
      province: adData.province,
      city: adData.city,
      district: adData.district,
      address: adData.address,
      showNumber: adData.showNumber ?? false,
      isActiveChat: adData.isActiveChat ?? false,
      options,
      publishedBy: ownerId,
    });
    created++;
    logger.debug({ title: adData.title, category: adData.categorySlug }, "Ad created");
  }
  return created;
}

async function seedBookmarksData(userIdMap: Map<string, mongoose.Types.ObjectId>): Promise<number> {
  const ads = await Ad.find({}).select("_id title").lean();
  if (ads.length === 0) return 0;

  let created = 0;
  for (const [mobile, userId] of userIdMap) {
    if (mobile === "09123456789") continue; // Skip admin
    const shuffled = [...ads].sort(() => 0.5 - Math.random());
    const toBookmark = shuffled.slice(0, Math.floor(Math.random() * 5) + 1);

    for (const ad of toBookmark) {
      try {
        await Bookmark.create({ user: userId, ad: ad._id, adTitle: ad.title });
        created++;
      } catch {
        // Duplicate, ignore
      }
    }
  }
  return created;
}

async function seedNotesData(userIdMap: Map<string, mongoose.Types.ObjectId>): Promise<number> {
  const ads = await Ad.find({}).select("_id title").lean();
  if (ads.length === 0) return 0;

  const noteContents = [
    "قیمت مناسب، باید دید.",
    "موقعیت عالی، نزدیک مترو.",
    "برای تکمیل 후 候選.",
    "گیم Prozentیدم، باید مذاکره کنم.",
    "تصاویر کامل‌تر می‌خواستم.",
    "موقعیت خوب، اما قیمت بالا.",
    "برای mẹ محترم، مناسب نیست.",
    "وضعیت بدنه عالی.",
    "باید با مشاوره چک کنم.",
    "موقعیت استراتژیک.",
  ];

  let created = 0;
  for (const [mobile, userId] of userIdMap) {
    if (mobile === "09123456789") continue;
    const shuffled = [...ads].sort(() => 0.5 - Math.random());
    const toNote = shuffled.slice(0, Math.floor(Math.random() * 3) + 1);

    for (const ad of toNote) {
      try {
        await Note.findOneAndUpdate(
          { user: userId, ad: ad._id },
          { content: noteContents[Math.floor(Math.random() * noteContents.length)], adTitle: ad.title },
          { upsert: true, new: true }
        );
        created++;
      } catch {
        // Ignore
      }
    }
  }
  return created;
}

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
    logger.info("Starting comprehensive seed...");

    const catResult = await seedCategoriesData();
    logger.info({ ...catResult }, "Categories seeded");

    const optResult = await seedOptionsData();
    logger.info({ ...optResult }, "Options seeded");

    const userIdMap = await seedUsersData();
    logger.info({ count: userIdMap.size }, "Users seeded");

    const adsCreated = await seedAdsData(userIdMap);
    logger.info({ created: adsCreated }, "Ads seeded");

    const bookmarksCreated = await seedBookmarksData(userIdMap);
    logger.info({ created: bookmarksCreated }, "Bookmarks seeded");

    const notesCreated = await seedNotesData(userIdMap);
    logger.info({ created: notesCreated }, "Notes seeded");

    await promoteAdmin();

    logger.info("Seeding completed successfully!");
  } catch (err) {
    logger.error({ err }, "Seed failed");
    throw err;
  } finally {
    await disconnectDB();
  }
}

void main().catch((err: unknown) => {
  logger.error({ err }, "Seed failed");
  process.exitCode = 1;
});