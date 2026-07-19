"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"   // Tema escuro nativo (padrão do site)
      enableSystem={false}  // Escuro por padrão; usuário alterna manualmente
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
