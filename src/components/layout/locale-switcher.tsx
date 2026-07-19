"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";

/** Alternância PT/EN preservando a rota atual (com pathnames traduzidos). */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  function switchTo(next: "pt" | "en") {
    if (next === locale) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace({ pathname, params: params as any } as any, { locale: next });
  }

  return (
    <div
      className="flex items-center rounded-full border border-border-subtle p-0.5 text-xs font-semibold"
      role="group"
      aria-label="Idioma / Language"
    >
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={locale === l}
          className={
            locale === l
              ? "rounded-full bg-brand px-2.5 py-1 text-brand-fg"
              : "rounded-full px-2.5 py-1 text-fg-muted transition hover:text-fg"
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
