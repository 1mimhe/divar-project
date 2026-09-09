import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toPage } from "../../src/common/utils/pagination.ts";
import { escapeRegExp } from "../../src/common/utils/regex.ts";

describe("pagination", () => {
  test("toPage computes envelope math", () => {
    assert.deepEqual(toPage(["a", "b"], 5, 1, 2), {
      data: ["a", "b"],
      page: 1,
      limit: 2,
      total: 5,
      pages: 3,
    });
  });

  test("empty results still report one page", () => {
    assert.deepEqual(toPage([], 0, 1, 20).pages, 1);
  });
});

describe("regex", () => {
  test("escapeRegExp neutralizes metacharacters", () => {
    assert.equal(escapeRegExp(".*"), "\\.\\*");
    assert.equal(new RegExp(escapeRegExp("(a+b)")).test("(a+b)"), true);
    assert.equal(new RegExp(escapeRegExp("(a+b)")).test("aaab"), false);
  });
});
