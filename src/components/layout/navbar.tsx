"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo, Wordmark } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { LocaleSwitcher } from "./locale-switcher";
import { UserMenu } from "@/components/auth/user-menu";
import { toolsHubUrl } from "@/lib/links";

const NAV_ITEMS = [
  { href: "/", key: "home" },
  { href: "/sobre", key: "about" },
  { href: "/competicoes", key: "competitions" },
  { href: "/rankings", key: "rankings" },
] as const;

/**
 * Navbar fixa (sticky) com blur — estilo sóbrio/premium.
 * Mobile: menu em painel deslizante.
 */
export function Navbar() {
  const t = useTranslations("nav");
  const hubUrl = toolsHubUrl(useLocale());
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        {/* Marca */}
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo />
          {/* No celular só o cubo, para caber idioma/tema/entrar */}
          <Wordmark className="hidden whitespace-nowrap text-lg sm:inline" />
        </Link>

        {/* Links — desktop */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg"
              >
                {t(item.key)}
              </Link>
            </li>
          ))}
          {/* Ferramentas: hub externo no mesmo idioma (mesma aba — o hub tem "Voltar para a CubingSP") */}
          <li>
            <a
              href={hubUrl}
              className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg"
            >
              {t("tools")}
            </a>
          </li>
        </ul>

        {/* Controles globais */}
        <div className="flex items-center gap-2.5">
          <LocaleSwitcher />
          <ThemeToggle />
          <UserMenu />

          {/* Hamburger — mobile */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex size-9 items-center justify-center rounded-full border border-border-subtle text-fg-muted md:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Painel mobile */}
      {open && (
        <div className="border-t border-border-subtle md:hidden">
          <ul className="mx-auto max-w-6xl space-y-1 px-4 py-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={hubUrl}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted transition hover:bg-bg-elevated hover:text-fg"
              >
                {t("tools")}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
