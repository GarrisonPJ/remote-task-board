import { QueryClient } from "@tanstack/react-query";

let queryClient: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClient) {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,       // 30s — data stays fresh between navigations
          retry: 1,                    // one retry before showing error state
          refetchOnWindowFocus: false, // explicit refetch only
        },
      },
    });
  }
  return queryClient;
}
