import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import mongoose from "mongoose";
import { createExpressApp } from "../../src/app.ts";
import { deleteUploads } from "../../src/modules/uploads/upload.ts";
import { User } from "../../src/modules/users/user.model.ts";

// ---------------------------------------------------------------------------
// Setup: fresh slate (drops domain collections incl. stale indexes),
// two users (owner promoted to admin), one ephemeral app per test.
// ---------------------------------------------------------------------------

const TEST_DB =
  process.env.TEST_MONGODB_URL ?? "mongodb://127.0.0.1:27017/divar-store-test";

let dbUp = false;
try {
  await mongoose.connect(TEST_DB, { serverSelectionTimeoutMS: 3000 });
  await mongoose.connection.db.collection("__gate").insertOne({ at: new Date() });
  await mongoose.connection.db.collection("__gate").deleteMany({});
  for (const name of ["categories", "options", "ads", "bookmarks", "notes"]) {
    await mongoose.connection.db.collection(name).drop().catch(() => undefined);
  }
  dbUp = true;
} catch {
  dbUp = false;
  try {
    await mongoose.disconnect();
  } catch {
    // ignore — never connected
  }
}

const usedMobiles: string[] = [];
const leftoverImages: string[] = [];

function freshMobile(): string {
  const mobile = `09${String(Math.floor(100000000 + Math.random() * 900000000))}`;
  usedMobiles.push(mobile);
  return mobile;
}

async function startApp(): Promise<{ base: string; close: () => void }> {
  const app = createExpressApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  return { base: `http://127.0.0.1:${port}`, close: () => server.close() };
}

async function login(base: string, mobile: string): Promise<string> {
  const sent = await fetch(`${base}/api/v1/auth/otp/send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mobile }),
  });
  assert.equal(sent.status, 200, "setup OTP send must succeed");
  const { previewCode } = (await sent.json()) as { previewCode: string };
  const verified = await fetch(`${base}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mobile, code: previewCode }),
  });
  assert.equal(verified.status, 200, "setup OTP verify must succeed");
  return verified.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

async function postJson(base: string, path: string, jar: string | undefined, body: unknown) {
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(jar ? { cookie: jar } : {}),
    },
    body: JSON.stringify(body),
  });
}

const gate = { skip: !dbUp };

// Shared fixtures, created once per file run.
let base = "";
let closeApp: (() => void) | undefined;
let adminJar = "";
let userJar = "";
let leafId = "";
let optionKey = "";

async function fixtures(): Promise<void> {
  if (base) return;
  const started = await startApp();
  base = started.base;
  closeApp = started.close;

  const adminMobile = freshMobile();
  const userMobile = freshMobile();
  adminJar = await login(base, adminMobile);
  userJar = await login(base, userMobile);
  await User.updateOne({ mobile: adminMobile }, { $set: { isAdmin: true } });

  // Root + leaf + one required option used across ad tests.
  const root = (await (
    await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Vehicles",
      icon: "car.svg",
    })
  ).json()) as { category: { _id: string } };
  const leaf = (await (
    await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Sedans",
      icon: "car.svg",
      parent: root.category._id,
    })
  ).json()) as { category: { _id: string } };
  leafId = leaf.category._id;
  const option = (await (
    await postJson(base, "/api/v1/options", adminJar, {
      title: "Kilometers",
      key: "km",
      type: "number",
      category: leafId,
      required: true,
    })
  ).json()) as { option: { key: string } };
  optionKey = option.option.key;
}

async function createAd(
  jar: string,
  overrides: Record<string, unknown> = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await postJson(base, "/api/v1/ads", jar, {
    title: "T Test Car",
    description: "A well-kept test sedan.",
    category: leafId,
    price: 100,
    province: "Tehran",
    city: "Tehran",
    options: { [optionKey]: 50000 },
    ...overrides,
  });
  const body = (await res.json()) as Record<string, unknown>;
  const ad = body.ad as { images?: string[] } | undefined;
  if (ad?.images) leftoverImages.push(...ad.images);
  return { status: res.status, body };
}

describe("users (needs local Mongo)", gate, () => {
  test("non-admin list is 403, anonymous is 401", async () => {
    await fixtures();
    const anon = await fetch(`${base}/api/v1/users`);
    assert.equal(anon.status, 401);
    const plain = await fetch(`${base}/api/v1/users`, { headers: { cookie: userJar } });
    assert.equal(plain.status, 403);
  });

  test("admin list exposes no secrets; unknown ids 400/404", async () => {
    await fixtures();
    const res = await fetch(`${base}/api/v1/users`, { headers: { cookie: adminJar } });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { users: Record<string, unknown>[] };
    assert.ok(body.users.length >= 2);
    for (const user of body.users) {
      assert.ok(!("otp" in user), "otp must never serialize");
      assert.ok(!("refreshTokens" in user), "refreshTokens must never serialize");
    }
    const malformed = await fetch(`${base}/api/v1/users/xyz`, {
      headers: { cookie: adminJar },
    });
    assert.equal(malformed.status, 400);
    const missing = await fetch(`${base}/api/v1/users/000000000000000000000000`, {
      headers: { cookie: adminJar },
    });
    assert.equal(missing.status, 404);
  });
});

describe("categories (needs local Mongo)", gate, () => {
  test("writes require admin; reads are public", async () => {
    await fixtures();
    const anon = await postJson(base, "/api/v1/categories", undefined, {
      name: "Nope",
      icon: "x.svg",
    });
    assert.equal(anon.status, 401);
    const plain = await postJson(base, "/api/v1/categories", userJar, {
      name: "Nope",
      icon: "x.svg",
    });
    assert.equal(plain.status, 403);
    const list = await fetch(`${base}/api/v1/categories`);
    assert.equal(list.status, 200);
  });

  test("slug auto-derives, duplicates conflict, tree nests", async () => {
    await fixtures();
    const first = await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Test Cars",
      icon: "car.svg",
    });
    assert.equal(first.status, 201);
    const created = (await first.json()) as { category: { slug: string; _id: string } };
    assert.equal(created.category.slug, "t-test-cars");

    const dup = await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Test Cars",
      icon: "car.svg",
    });
    assert.equal(dup.status, 409);

    const child = await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Child",
      icon: "car.svg",
      parent: created.category._id,
    });
    assert.equal(child.status, 201);

    const tree = (await (
      await fetch(`${base}/api/v1/categories?tree=true`)
    ).json()) as {
      categories: Array<{ slug: string; children: Array<{ slug: string }> }>;
    };
    const node = tree.categories.find((entry) => entry.slug === "t-test-cars");
    assert.ok(node);
    assert.deepEqual(
      node.children.map((entry) => entry.slug),
      ["t-child"],
    );

    const badParent = await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Orphan",
      icon: "x.svg",
      parent: "not-an-id",
    });
    assert.equal(badParent.status, 400);
    const missingParent = await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Orphan",
      icon: "x.svg",
      parent: "000000000000000000000000",
    });
    assert.equal(missingParent.status, 404);
  });

  test("a category with options cannot gain children", async () => {
    await fixtures();
    const child = await postJson(base, "/api/v1/categories", adminJar, {
      name: "T Sedan Child",
      icon: "car.svg",
      parent: leafId,
    });
    assert.equal(child.status, 400);
  });

  test("delete cascades options and is blocked by ads", async () => {
    await fixtures();
    const created = await createAd(adminJar);
    assert.equal(created.status, 201);
    const adId = (created.body.ad as { _id: string })._id;

    const blocked = await fetch(`${base}/api/v1/categories/${leafId}`, {
      method: "DELETE",
      headers: { cookie: adminJar },
    });
    assert.equal(blocked.status, 409);

    const removed = await fetch(`${base}/api/v1/ads/${adId}`, {
      method: "DELETE",
      headers: { cookie: adminJar },
    });
    assert.equal(removed.status, 200);
  });

  test("delete removes the subtree with its options", async () => {
    await fixtures();
    const root = (await (
      await postJson(base, "/api/v1/categories", adminJar, {
        name: "T Temp",
        icon: "x.svg",
      })
    ).json()) as { category: { _id: string } };
    const child = (await (
      await postJson(base, "/api/v1/categories", adminJar, {
        name: "T Temp Child",
        icon: "x.svg",
        parent: root.category._id,
      })
    ).json()) as { category: { _id: string } };
    const option = await postJson(base, "/api/v1/options", adminJar, {
      title: "T Temp Opt",
      key: "temp_opt",
      type: "string",
      category: child.category._id,
    });
    assert.equal(option.status, 201);

    const removed = await fetch(`${base}/api/v1/categories/${root.category._id}`, {
      method: "DELETE",
      headers: { cookie: adminJar },
    });
    assert.equal(removed.status, 200);
    const body = (await removed.json()) as { deleted: { categories: number; options: number } };
    assert.deepEqual(body.deleted, { categories: 2, options: 1 });

    const gone = await fetch(`${base}/api/v1/options/by-category/${child.category._id}`);
    assert.equal(gone.status, 404);
  });
});

describe("options (needs local Mongo)", gate, () => {
  test("options live on leaves: parents rejected, keys unique per category", async () => {
    await fixtures();
    const roots = (await (await fetch(`${base}/api/v1/categories`)).json()) as {
      categories: Array<{ _id: string; slug: string }>;
    };
    const root = roots.categories.find((entry) => entry.slug === "t-vehicles");
    assert.ok(root);

    const onParent = await postJson(base, "/api/v1/options", adminJar, {
      title: "Bad",
      key: "bad",
      type: "string",
      category: root._id,
    });
    assert.equal(onParent.status, 400);

    const dup = await postJson(base, "/api/v1/options", adminJar, {
      title: "Kilometers Again",
      key: "km",
      type: "number",
      category: leafId,
    });
    assert.equal(dup.status, 409);

    const otherLeaf = (await (
      await postJson(base, "/api/v1/categories", adminJar, {
        name: "T Coupes",
        icon: "car.svg",
        parent: root._id,
      })
    ).json()) as { category: { _id: string } };
    const sameKey = await postJson(base, "/api/v1/options", adminJar, {
      title: "Kilometers",
      key: "km",
      type: "number",
      category: otherLeaf.category._id,
    });
    assert.equal(sameKey.status, 201);
  });

  test("update returns the new doc; remove really removes", async () => {
    await fixtures();
    const created = await postJson(base, "/api/v1/options", adminJar, {
      title: "T Color",
      key: "T Car Color",
      type: "string",
      category: leafId,
    });
    assert.equal(created.status, 201);
    const option = (await created.json()) as { option: { _id: string; key: string } };
    assert.equal(option.option.key, "t_car_color");

    const updated = await fetch(`${base}/api/v1/options/${option.option._id}`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie: adminJar },
      body: JSON.stringify({ guide: "Pick one" }),
    });
    assert.equal(updated.status, 200);
    const updatedBody = (await updated.json()) as { option: { guide: string } };
    assert.equal(updatedBody.option.guide, "Pick one");

    const removed = await fetch(`${base}/api/v1/options/${option.option._id}`, {
      method: "DELETE",
      headers: { cookie: adminJar },
    });
    assert.equal(removed.status, 200);
    const gone = await fetch(`${base}/api/v1/options/${option.option._id}`);
    assert.equal(gone.status, 404);
  });

  test("by-category-slug lookup works", async () => {
    await fixtures();
    const res = await fetch(`${base}/api/v1/options/by-category-slug/t-sedans`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { options: Array<{ key: string }> };
    assert.ok(body.options.some((entry) => entry.key === optionKey));
  });
});

describe("ads (needs local Mongo)", gate, () => {
  test("create validates category and options strictly", async () => {
    await fixtures();
    const anon = await postJson(base, "/api/v1/ads", undefined, { title: "x" });
    assert.equal(anon.status, 401);

    const malformed = await createAd(adminJar, { category: "xyz" });
    assert.equal(malformed.status, 400);

    const missing = await createAd(adminJar, { category: "000000000000000000000000" });
    assert.equal(missing.status, 404);

    const roots = (await (await fetch(`${base}/api/v1/categories`)).json()) as {
      categories: Array<{ _id: string; slug: string }>;
    };
    const root = roots.categories.find((entry) => entry.slug === "t-vehicles");
    assert.ok(root);
    const onParent = await createAd(adminJar, { category: root._id });
    assert.equal(onParent.status, 400);

    const noRequired = await createAd(adminJar, { options: {} });
    assert.equal(noRequired.status, 400);

    const unknownKey = await createAd(adminJar, { options: { nope: 1, [optionKey]: 1 } });
    assert.equal(unknownKey.status, 400);

    const wrongType = await createAd(adminJar, { options: { [optionKey]: "lots" } });
    assert.equal(wrongType.status, 400);
  });

  test("create stores options by key; detail populates", async () => {
    await fixtures();
    const { status, body } = await createAd(adminJar, {
      title: "T Special $100 (One)",
      options: { [optionKey]: 42 },
    });
    assert.equal(status, 201);
    const ad = body.ad as { _id: string; options: Record<string, number> };
    assert.equal(ad.options[optionKey], 42);

    const shown = (await (await fetch(`${base}/api/v1/ads/${ad._id}`)).json()) as {
      ad: { category: { slug: string } };
    };
    assert.equal(shown.ad.category.slug, "t-sedans");
  });

  test("search is literal and paginated with a clamped limit", async () => {
    await fixtures();
    const first = await createAd(adminJar, { title: "T Red Sedan" });
    assert.equal(first.status, 201);
    const second = await createAd(adminJar, { title: "T Blue Sedan" });
    assert.equal(second.status, 201);

    const literal = await fetch(`${base}/api/v1/ads?search=${encodeURIComponent("T Red")}`);
    assert.equal(literal.status, 200);
    const literalBody = (await literal.json()) as { total: number };
    assert.ok(literalBody.total >= 1);

    // Regex metacharacters are literal: nothing contains ".*".
    const meta = await fetch(`${base}/api/v1/ads?search=${encodeURIComponent(".*")}&limit=500`);
    assert.equal(meta.status, 200);
    const metaBody = (await meta.json()) as { limit: number; total: number };
    assert.equal(metaBody.limit, 50);
    assert.equal(metaBody.total, 0);

    const res = await fetch(`${base}/api/v1/ads?limit=500`);
    assert.equal(res.status, 200);
    const page = (await res.json()) as { limit: number; total: number; data: unknown[] };
    assert.equal(page.limit, 50);
    assert.ok(page.total >= 2);
    assert.ok(page.data.length <= 50);
  });

  test("delete is owner-or-admin with 404 after", async () => {
    await fixtures();
    const { body } = await createAd(adminJar);
    const adId = (body.ad as { _id: string })._id;

    const foreign = await fetch(`${base}/api/v1/ads/${adId}`, {
      method: "DELETE",
      headers: { cookie: userJar },
    });
    assert.equal(foreign.status, 403);

    const mine = await fetch(`${base}/api/v1/ads/mine`, {
      headers: { cookie: adminJar },
    });
    assert.equal(mine.status, 200);
    const mineBody = (await mine.json()) as { ads: Array<{ _id: string }> };
    assert.ok(mineBody.ads.some((entry) => entry._id === adId));

    const removed = await fetch(`${base}/api/v1/ads/${adId}`, {
      method: "DELETE",
      headers: { cookie: adminJar },
    });
    assert.equal(removed.status, 200);
    const gone = await fetch(`${base}/api/v1/ads/${adId}`);
    assert.equal(gone.status, 404);
  });

  test("image upload accepts png, rejects spoofed and oversized files", async () => {
    await fixtures();
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );

    async function postAdWithFile(name: string, type: string, bytes: Buffer) {
      const form = new FormData();
      form.set("title", "T Pic Car");
      form.set("description", "With a picture.");
      form.set("category", leafId);
      form.set("province", "Tehran");
      form.set("city", "Tehran");
      form.set("options", JSON.stringify({ [optionKey]: 10 }));
      form.set("images", new File([bytes], name, { type }));
      return fetch(`${base}/api/v1/ads`, { method: "POST", headers: { cookie: adminJar }, body: form });
    }

    const ok = await postAdWithFile("pic.png", "image/png", png);
    assert.equal(ok.status, 201);
    const okBody = (await ok.json()) as { ad: { _id: string; images: string[] } };
    assert.equal(okBody.ad.images.length, 1);
    assert.match(okBody.ad.images[0], /^\/uploads\//);

    const spoofed = await postAdWithFile("evil.jpg", "application/x-msdownload", png);
    assert.equal(spoofed.status, 400);

    const big = await postAdWithFile("big.png", "image/png", Buffer.alloc(3 * 1000 * 1000 + 1));
    assert.equal(big.status, 400);

    const cleanup = await fetch(`${base}/api/v1/ads/${okBody.ad._id}`, {
      method: "DELETE",
      headers: { cookie: adminJar },
    });
    assert.equal(cleanup.status, 200);
  });
});

describe("bookmarks and notes (needs local Mongo)", gate, () => {
  test("bookmarking is idempotent; unbookmark of missing is 404", async () => {
    await fixtures();
    const { body } = await createAd(adminJar);
    const adId = (body.ad as { _id: string })._id;

    const first = await fetch(`${base}/api/v1/ads/${adId}/bookmark`, {
      method: "POST",
      headers: { cookie: userJar },
    });
    assert.equal(first.status, 200);
    const second = await fetch(`${base}/api/v1/ads/${adId}/bookmark`, {
      method: "POST",
      headers: { cookie: userJar },
    });
    assert.equal(second.status, 200);

    const listed = (await (
      await fetch(`${base}/api/v1/me/bookmarks`, { headers: { cookie: userJar } })
    ).json()) as { bookmarks: Array<{ ad: { _id: string } | string }> };
    const adIds = listed.bookmarks.map((entry) =>
      typeof entry.ad === "string" ? entry.ad : String(entry.ad._id),
    );
    assert.equal(adIds.filter((id) => id === adId).length, 1);

    const removed = await fetch(`${base}/api/v1/ads/${adId}/bookmark`, {
      method: "DELETE",
      headers: { cookie: userJar },
    });
    assert.equal(removed.status, 200);
    const again = await fetch(`${base}/api/v1/ads/${adId}/bookmark`, {
      method: "DELETE",
      headers: { cookie: userJar },
    });
    assert.equal(again.status, 404);

    const missing = await fetch(`${base}/api/v1/ads/000000000000000000000000/bookmark`, {
      method: "POST",
      headers: { cookie: userJar },
    });
    assert.equal(missing.status, 404);
  });

  test("notes upsert per user; two users can note the same ad", async () => {
    await fixtures();
    const { body } = await createAd(adminJar);
    const adId = (body.ad as { _id: string })._id;

    async function saveNote(jar: string, content: string) {
      return postJson(base, `/api/v1/ads/${adId}/note`, jar, { content });
    }

    const first = await saveNote(userJar, "First thought");
    assert.equal(first.status, 201);
    const second = await saveNote(userJar, "Second thought");
    assert.equal(second.status, 200);

    const shown = (await (
      await fetch(`${base}/api/v1/ads/${adId}/note`, { headers: { cookie: userJar } })
    ).json()) as { note: { content: string } };
    assert.equal(shown.note.content, "Second thought");

    const other = await saveNote(adminJar, "Owner note");
    assert.ok(other.status === 201 || other.status === 200);

    const removed = await fetch(`${base}/api/v1/ads/${adId}/note`, {
      method: "DELETE",
      headers: { cookie: userJar },
    });
    assert.equal(removed.status, 200);
    const gone = await fetch(`${base}/api/v1/ads/${adId}/note`, {
      headers: { cookie: userJar },
    });
    assert.equal(gone.status, 404);
  });
});

after(async () => {
  if (closeApp) closeApp();
  if (!dbUp) return;
  try {
    await deleteUploads(leftoverImages);
    for (const name of ["categories", "options", "ads", "bookmarks", "notes"]) {
      await mongoose.connection.db.collection(name).deleteMany({});
    }
    if (usedMobiles.length) {
      await User.deleteMany({ mobile: { $in: usedMobiles } });
    }
  } finally {
    await mongoose.disconnect();
  }
});
