import assert from "node:assert/strict";
import test from "node:test";
import { formatRange, isInRange, parseISODate, toISODate } from "../src/lib/date-range.ts";

test("parses YYYY-MM-DD as a local date, not UTC", () => {
  const d = parseISODate("2026-11-18");
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 10);
  assert.equal(d.getDate(), 18);
  assert.equal(toISODate(d), "2026-11-18");
});

test("includes the whole last day of the range", () => {
  const range = { from: "2026-11-12", to: "2026-11-18" };
  assert.equal(isInRange(new Date(2026, 10, 12, 0, 0).getTime(), range), true);
  assert.equal(isInRange(new Date(2026, 10, 18, 23, 59).getTime(), range), true);
  assert.equal(isInRange(new Date(2026, 10, 19, 0, 0).getTime(), range), false);
  assert.equal(isInRange(new Date(2026, 10, 11, 23, 59).getTime(), range), false);
});

test("formats ranges compactly", () => {
  assert.equal(formatRange({ from: "2026-11-18", to: "2026-11-18" }).includes("18"), true);
  assert.match(formatRange({ from: "2026-11-12", to: "2026-11-18" }), /^12 – 18/);
  assert.match(formatRange({ from: "2026-10-28", to: "2026-11-03" }), /28.*–.*3/);
});
