"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "@/i18n/routing";
import { FLAGS } from "@/components/ui/flag";

type Locale = "pt" | "es" | "en";

// Ordem pedida: PT, ES, EN
const LOCALES: { code: Locale; label: string }[] = [
  { code: "pt", label: "PT" },
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

/** Dropdown de idioma com bandeiras SVG, preservando a rota atual. */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora / Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace({ pathname, params: params as any } as any, { locale: next });
  }

  const Current = FLAGS[locale];
  const currentLabel = LOCALES.find((l) => l.code === locale)?.label ?? "PT";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Idioma / Language / Idioma"
        className="flex items-center gap-1.5 rounded-full border border-border-subtle px-2.5 py-1.5 text-xs font-semibold text-fg transition hover:border-brand"
      >
        <Current />
        <span>{currentLabel}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-fg-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated py-1 shadow-lg"
        >
          {LOCALES.map(({ code, label }) => {
            const Flag = FLAGS[code];
            const active = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => switchTo(code)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-bg ${
                    active ? "font-semibold text-fg" : "text-fg-muted"
                  }`}
                >
                  <Flag />
                  <span>{label}</span>
                  {active && (
                    <svg className="ml-auto text-link" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
