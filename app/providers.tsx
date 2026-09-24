"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { SessionExpiryDialog } from "@/components/auth/session-expiry-dialog";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: (failureCount) => failureCount < 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionExpiryDialog />
      {children}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
