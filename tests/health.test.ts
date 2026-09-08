import assert from "node:assert/strict";
import test from "node:test";
import { createExpressApp } from "../src/app.ts";

test("GET /health returns ok", async () => {
  const app = createExpressApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object", "server should listen");
  const port = (address as { port: number }).port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { status: string };
    assert.equal(body.status, "ok");
  } finally {
    server.close();
  }
});

test("unknown API route returns 404 JSON, unknown page renders HTML", async () => {
  const app = createExpressApp();
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const port = (server.address() as { port: number }).port;
  try {
    const api = await fetch(`http://127.0.0.1:${port}/api/v1/nope-404`);
    assert.equal(api.status, 404);
    const body = (await api.json()) as { statusCode: number };
    assert.equal(body.statusCode, 404);

    const page = await fetch(`http://127.0.0.1:${port}/nope-404`);
    assert.equal(page.status, 404);
    assert.match(page.headers.get("content-type") ?? "", /text\/html/);
  } finally {
    server.close();
  }
});
