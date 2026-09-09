import assert from "node:assert/strict";
import { after, describe, test } from "node:test";
import mongoose from "mongoose";
import { createExpressApp } from "../../src/app.ts";
import { deleteUploads } from "../../src/modules/uploads/upload.ts";
import { User } from "../../src/modules/users/user.model.ts";

// ---------------------------------------------------------------------------
// Always-run page tests (no DB): shells render, guards redirect, HTML errors.
// ---------------------------------------------------------------------------

async function startApp(): Promise<{ base: string; close: () => void }> {
  const app = createExpressApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  return { base: `http://127.0.0.1:${port}`, close: () => server.close() };
}

describe("pages without DB", () => {
  test("login page renders the send form", async () => {
    const { base, close } = await startApp();
    try {
      const res = await fetch(`${base}/auth/login`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.match(html, /\/auth\/otp\/send/);
    } finally {
      close();
    }
  });

  test("anonymous panel routes redirect to login", async () => {
    const { base, close } = await startApp();
    try {
      for (const path of ["/panel", "/panel/ads", "/panel/ads/new", "/panel/bookmarks"]) {
        const res = await fetch(`${base}${path}`, { redirect: "manual" });
        assert.equal(res.status, 302, path);
        assert.equal(res.headers.get("location"), "/auth/login");
      }
    } finally {
      close();
    }
  });

  test("unknown page renders HTML error, unknown API stays JSON", async () => {
    const { base, close } = await startApp();
    try {
      const page = await fetch(`${base}/no-such-page`);
      assert.equal(page.status, 404);
      assert.match(page.headers.get("content-type") ?? "", /text\/html/);
      assert.match(await page.text(), /بازگشت به صفحه اصلی/);

      const api = await fetch(`${base}/api/v1/nope`);
      assert.equal(api.status, 404);
      assert.match(api.headers.get("content-type") ?? "", /application\/json/);
    } finally {
      close();
    }
  });
});

// ---------------------------------------------------------------------------
// DB-gated flows (own V-prefixed fixtures, cleaned up afterwards).
// ---------------------------------------------------------------------------

const TEST_DB =
  process.env.TEST_MONGODB_URL ?? "mongodb://127.0.0.1:27018/divar-store-test";

let dbUp = false;
try {
  await mongoose.connect(TEST_DB, { serverSelectionTimeoutMS: 3000 });
  await mongoose.connection.db.collection("__gate").insertOne({ at: new Date() });
  await mongoose.connection.db.collection("__gate").deleteMany({});
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
const createdIds = { categories: [] as string[], ads: [] as string[] };
const leftoverImages: string[] = [];

function freshMobile(): string {
  const mobile = `09${String(Math.floor(100000000 + Math.random() * 900000000))}`;
  usedMobiles.push(mobile);
  return mobile;
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

function jarOf(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

let base = "";
let closeApp: (() => void) | undefined;
let jar = "";
let leafId = "";
let leafSlug = "";
let optionKey = "";
let adId = "";

async function fixtures(): Promise<void> {
  if (base) return;
  const started = await startApp();
  base = started.base;
  closeApp = started.close;

  const mobile = freshMobile();
  const sent = await postJson(base, "/api/v1/auth/otp/send", undefined, { mobile });
  assert.equal(sent.status, 200);
  const { previewCode } = (await sent.json()) as { previewCode: string };
  const verified = await postJson(base, "/api/v1/auth/otp/verify", undefined, {
    mobile,
    code: previewCode,
  });
  assert.equal(verified.status, 200);
  jar = jarOf(verified);
  await User.updateOne({ mobile }, { $set: { isAdmin: true } });

  const leaf = (await (
    await postJson(base, "/api/v1/categories", jar, {
      name: "V Leaf",
      icon: "car.svg",
    })
  ).json()) as { category: { _id: string; slug: string } };
  leafId = leaf.category._id;
  leafSlug = leaf.category.slug;
  createdIds.categories.push(leafId);

  const option = (await (
    await postJson(base, "/api/v1/options", jar, {
      title: "V Kilometers",
      key: "v_km",
      type: "number",
      category: leafId,
      required: true,
    })
  ).json()) as { option: { key: string } };
  optionKey = option.option.key;

  const created = await postJson(base, "/api/v1/ads", jar, {
    title: "V Test Sedan",
    description: "A view-suite sedan.",
    category: leafId,
    price: 50,
    province: "Tehran",
    city: "Tehran",
    options: { [optionKey]: 123 },
  });
  assert.equal(created.status, 201);
  const createdBody = (await created.json()) as { ad: { _id: string; images: string[] } };
  adId = createdBody.ad._id;
  createdIds.ads.push(adId);
  leftoverImages.push(...createdBody.ad.images);
}

const gate = { skip: !dbUp };

describe("pages with DB (needs local Mongo)", gate, () => {
  test("home shows the ad and the category", async () => {
    await fixtures();
    const res = await fetch(`${base}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /V Test Sedan/);
    assert.match(html, /V Leaf/);
  });

  test("detail shows options, gallery and an empty note form", async () => {
    await fixtures();
    const res = await fetch(`${base}/a/${adId}`, { headers: { cookie: jar } });
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.match(html, /V Test Sedan/);
    assert.match(html, /V Kilometers/);
    assert.match(html, /name="content"/);
  });

  test("wrong code re-renders the verify form", async () => {
    await fixtures();
    const mobile = freshMobile();
    await postJson(base, "/api/v1/auth/otp/send", undefined, { mobile });
    const res = await fetch(`${base}/auth/otp/verify`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ mobile, code: "00000" }),
    });
    // Locked or wrong: either way the form comes back, never JSON.
    assert.ok([401, 429].includes(res.status));
    assert.match(res.headers.get("content-type") ?? "", /text\/html/);
  });

  test("panel dashboard, lists and create browser render", async () => {
    await fixtures();
    for (const path of ["/panel", "/panel/ads", "/panel/bookmarks", "/panel/notes"]) {
      const res = await fetch(`${base}${path}`, { headers: { cookie: jar } });
      assert.equal(res.status, 200, path);
    }
    const browser = await fetch(`${base}/panel/ads/new`, { headers: { cookie: jar } });
    assert.equal(browser.status, 200);
    const form = await fetch(`${base}/panel/ads/new?slug=${leafSlug}`, {
      headers: { cookie: jar },
    });
    assert.equal(form.status, 200);
    const html = await form.text();
    assert.match(html, new RegExp(optionKey));
  });

  test("panel publish validates and lists; bookmark and note actions redirect", async () => {
    await fixtures();
    const bad = new FormData();
    bad.set("category", leafId);
    bad.set("province", "Tehran");
    bad.set("city", "Tehran");
    bad.set("description", "Missing title.");
    bad.set("options", JSON.stringify({ [optionKey]: 1 }));
    const rejected = await fetch(`${base}/panel/ads`, {
      method: "POST",
      headers: { cookie: jar },
      body: bad,
    });
    assert.equal(rejected.status, 422);
    assert.match(await rejected.text(), /alert-danger/);

    const good = new FormData();
    good.set("title", "V Panel Car");
    good.set("description", "Published from the panel form.");
    good.set("category", leafId);
    good.set("province", "Tehran");
    good.set("city", "Tehran");
    good.set(optionKey, "7");
    const published = await fetch(`${base}/panel/ads`, {
      method: "POST",
      headers: { cookie: jar, },
      body: good,
      redirect: "manual",
    });
    assert.equal(published.status, 302);
    assert.equal(published.headers.get("location"), "/panel/ads");

    const mine = await fetch(`${base}/panel/ads`, { headers: { cookie: jar } });
    assert.match(await mine.text(), /V Panel Car/);

    const bookmarked = await fetch(`${base}/a/${adId}/bookmark`, {
      method: "POST",
      headers: { cookie: jar },
      redirect: "manual",
    });
    assert.equal(bookmarked.status, 302);

    const noted = await fetch(`${base}/a/${adId}/note`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", cookie: jar },
      body: new URLSearchParams({ content: "View note" }),
      redirect: "manual",
    });
    assert.equal(noted.status, 302);

    const detail = await fetch(`${base}/a/${adId}`, { headers: { cookie: jar } });
    assert.match(await detail.text(), /View note/);
  });

  test("logout clears the session and locks the panel", async () => {
    await fixtures();
    const out = await fetch(`${base}/auth/logout`, {
      method: "POST",
      headers: { cookie: jar },
      redirect: "manual",
    });
    assert.equal(out.status, 302);
    assert.match(out.headers.getSetCookie().join(";"), /access_token=/);

    // Fresh login for the remaining suite (the jar above just died).
    const mobile = freshMobile();
    const sent = await postJson(base, "/api/v1/auth/otp/send", undefined, { mobile });
    assert.equal(sent.status, 200);
    const { previewCode } = (await sent.json()) as { previewCode: string };
    const verified = await postJson(base, "/api/v1/auth/otp/verify", undefined, {
      mobile,
      code: previewCode,
    });
    assert.equal(verified.status, 200);
    jar = jarOf(verified);
    await User.updateOne({ mobile }, { $set: { isAdmin: true } });
  });
});

after(async () => {
  if (closeApp) closeApp();
  if (!dbUp) return;
  try {
    await deleteUploads(leftoverImages);
    const db = mongoose.connection.db;
    if (createdIds.ads.length) {
      await db.collection("ads").deleteMany({ _id: { $in: createdIds.ads.map((id) => new mongoose.Types.ObjectId(id)) } });
    }
    if (createdIds.categories.length) {
      const ids = createdIds.categories.map((id) => new mongoose.Types.ObjectId(id));
      await db.collection("options").deleteMany({ category: { $in: ids } });
      await db.collection("categories").deleteMany({ _id: { $in: ids } });
    }
    await db.collection("bookmarks").deleteMany({});
    await db.collection("notes").deleteMany({});
    if (usedMobiles.length) {
      await User.deleteMany({ mobile: { $in: usedMobiles } });
    }
  } finally {
    await mongoose.disconnect();
  }
});
