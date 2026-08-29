import assert from "node:assert/strict";
import test from "node:test";
import { QueryClient } from "@tanstack/react-query";
import { artisanQueryKeys, clearArtisanCache } from "../src/lib/artisan-query-cache.ts";

test("keeps each user's Artisan data in a separate cache entry", () => {
  const queryClient = new QueryClient();
  const userAKey = artisanQueryKeys.data("user-a");
  const userBKey = artisanQueryKeys.data("user-b");

  queryClient.setQueryData(userAKey, { sales: ["sale-a"] });

  assert.deepEqual(queryClient.getQueryData(userAKey), { sales: ["sale-a"] });
  assert.equal(queryClient.getQueryData(userBKey), undefined);
});

test("removes every authenticated user's Artisan cache on an identity change", () => {
  const queryClient = new QueryClient();
  const userAKey = artisanQueryKeys.data("user-a");
  const userBKey = artisanQueryKeys.data("user-b");

  queryClient.setQueryData(userAKey, { sales: ["sale-a"] });
  queryClient.setQueryData(userBKey, { sales: ["sale-b"] });
  clearArtisanCache(queryClient);

  assert.equal(queryClient.getQueryData(userAKey), undefined);
  assert.equal(queryClient.getQueryData(userBKey), undefined);
});
