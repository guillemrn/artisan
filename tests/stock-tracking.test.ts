import assert from "node:assert/strict";
import test from "node:test";
import { tracksStock } from "../src/lib/artisan-data.ts";

test("products without the flag keep tracking stock (existing data)", () => {
  assert.equal(tracksStock({}), true);
  assert.equal(tracksStock({ trackStock: true }), true);
});

test("products can opt out of stock tracking", () => {
  assert.equal(tracksStock({ trackStock: false }), false);
});
