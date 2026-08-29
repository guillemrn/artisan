import type { QueryClient } from "@tanstack/react-query";

export const artisanQueryKeys = {
  all: ["artisan"] as const,
  data: (ownerId: string) => [...artisanQueryKeys.all, "data", ownerId] as const,
};

export function clearArtisanCache(queryClient: Pick<QueryClient, "removeQueries">): void {
  queryClient.removeQueries({ queryKey: artisanQueryKeys.all });
}
