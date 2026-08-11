import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

if (typeof window !== "undefined") {
  (window as any).$_TSR = (window as any).$_TSR || {
    initialized: false,
    buffer: [],
    h: () => {},
    router: {
      matches: [],
      manifest: undefined,
      dehydratedData: undefined,
      lastMatchId: undefined,
    },
  };
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
