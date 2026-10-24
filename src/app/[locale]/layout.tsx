import type { Metadata } from "next";
import { Geist, Geist_Mono, Tomorrow } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "../globals.css";

// Geist: open source (Google Fonts), moderna, UTF-8 completo.
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
// Tomorrow (OFL): fonte da marca — wordmark e títulos, também no Instagram.
const tomorrow = Tomorrow({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-tomorrow",
});

export const metadata: Metadata = {
  title: {
    default: "CubingSP — Cubo Mágico em São Paulo",
    template: "%s | CubingSP",
  },
  description:
    "Associação de competidores e entusiastas de cubo mágico do estado de São Paulo. Competições, rankings e comunidade.",
};

// SSG: gera /pt e /en em build — layouts saem como asset estático.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Habilita renderização estática das páginas deste layout.
  setRequestLocale(locale);

  return (
    // suppressHydrationWarning: next-themes ajusta a classe no <html>
    <html lang={locale} suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${tomorrow.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider>
            <Navbar />
            {children}
            <Footer />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
