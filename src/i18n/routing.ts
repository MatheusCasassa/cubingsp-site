import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  // 'as-needed': português (padrão) fica sem prefixo (/sobre),
  // inglês ganha prefixo (/en/about ─ via pathnames abaixo).
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/sobre": { pt: "/sobre", en: "/about" },
    "/competicoes": { pt: "/competicoes", en: "/competitions" },
    "/competicoes/[slug]": { pt: "/competicoes/[slug]", en: "/competitions/[slug]" },
    "/noticias": { pt: "/noticias", en: "/news" },
    "/noticias/[slug]": { pt: "/noticias/[slug]", en: "/news/[slug]" },
    "/rankings": "/rankings",
    "/rankings/[eventId]": "/rankings/[eventId]",
    "/ferramentas": { pt: "/ferramentas", en: "/tools" },
    "/formularios/[slug]": { pt: "/formularios/[slug]", en: "/forms/[slug]" },
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
