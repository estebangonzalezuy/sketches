"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Dark by default; the visitor can switch to light or follow the system. */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      {children}
    </NextThemesProvider>
  );
}
