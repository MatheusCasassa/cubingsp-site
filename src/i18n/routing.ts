import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["pt", "en", "es"],
  defaultLocale: "pt",
  // 'as-needed': português (padrão) fica sem prefixo (/sobre),
  // inglês e espanhol ganham prefixo (/en/about, /es/competiciones).
  localePrefix: "as-needed",
  pathnames: {
    "/": "/",
    "/sobre": { pt: "/sobre", en: "/about", es: "/sobre" },
    "/competicoes": { pt: "/competicoes", en: "/competitions", es: "/competiciones" },
    "/competicoes/[slug]": {
      pt: "/competicoes/[slug]",
      en: "/competitions/[slug]",
      es: "/competiciones/[slug]",
    },
    "/noticias": { pt: "/noticias", en: "/news", es: "/noticias" },
    "/noticias/[slug]": {
      pt: "/noticias/[slug]",
      en: "/news/[slug]",
      es: "/noticias/[slug]",
    },
    "/rankings": "/rankings",
    "/rankings/[eventId]": "/rankings/[eventId]",
    "/ferramentas": { pt: "/ferramentas", en: "/tools", es: "/herramientas" },
    "/formularios/[slug]": {
      pt: "/formularios/[slug]",
      en: "/forms/[slug]",
      es: "/formularios/[slug]",
    },
  },
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
