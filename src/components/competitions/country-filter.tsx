"use client";

import { useEffect, useRef, useState } from "react";
import { CountryFlag } from "@/components/ui/region-flag";

export interface CountryOption {
  iso: string;
  name: string;
  count: number;
}

/**
 * Filtro de país da aba LATAM, com bandeiras. O <select> nativo não mostra
 * imagens, então é uma lista própria (mesmo padrão do seletor de idioma):
 * fecha ao clicar fora ou com Esc, setas ↑/↓ navegam, Enter escolhe.
 */
export function CountryFilter({
  value,
  onChange,
  options,
  locale,
  label,
  allLabel,
  totalCount,
}: {
  value: string;
  onChange: (iso: string) => void;
  options: CountryOption[];
  locale: string;
  label: string;
  allLabel: string;
  totalCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const items = [{ iso: "", name: allLabel, count: totalCount }, ...options];
  const selected = items.find((o) => o.iso === value) ?? items[0];

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, items.findIndex((o) => o.iso === value)));
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function choose(iso: string) {
    onChange(iso);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      return setOpen(true);
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(items[active].iso);
    }
  }

  return (
    <div ref={ref} className="relative flex items-center gap-2 text-sm" onKeyDown={onKeyDown}>
      <span className="font-medium">{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-w-48 items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-1.5 text-left transition hover:border-brand"
      >
        {selected.iso ? <CountryFlag iso={selected.iso} locale={locale} /> : null}
        <span className="flex-1 truncate">{selected.name}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-fg-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-40 mt-2 max-h-80 w-64 overflow-auto rounded-xl border border-border-subtle bg-bg-elevated py-1 shadow-lg"
        >
          {items.map((o, i) => (
            <li key={o.iso || "all"}>
              <button
                type="button"
                role="option"
                aria-selected={o.iso === value}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(o.iso)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition ${
                  i === active ? "bg-bg" : ""
                } ${o.iso === value ? "font-semibold text-fg" : "text-fg-muted"}`}
              >
                {o.iso ? (
                  <CountryFlag iso={o.iso} locale={locale} />
                ) : (
                  <span className="inline-block w-[19px]" aria-hidden />
                )}
                <span className="flex-1 truncate">{o.name}</span>
                <span className="font-mono text-xs opacity-70">{o.count}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
