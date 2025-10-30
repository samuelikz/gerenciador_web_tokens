"use client";

import { TokensProvider } from "@/contexts/tokens-context";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TokensProvider>
      <AuthProvider>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </TokensProvider>
  );
}
