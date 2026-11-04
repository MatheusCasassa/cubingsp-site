"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { wcaProfileUrl, type Champion, type ChampionEntry, type RankingsIndex } from "@/lib/rankings/types";
import { eventName } from "@/lib/rankings/events";

/** Foto redonda da WCA; sem foto, as iniciais. */
function Avatar({ c, size = "size-16" }: { c: Champion; size?: string }) {
  const initials = c.name
    .replace(/\(.*?\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .filter((_, i, a) => i === 0 || i === a.length - 1)
    .join("")
    .toUpperCase();
  return c.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={c.avatar}
      alt=""
      loading="lazy"
      className={`${size} shrink-0 rounded-full object-cover ring-2 ring-border-subtle`}
    />
  ) : (
    <span
      aria-hidden
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-brand font-display text-lg font-bold text-brand-fg ring-2 ring-border-subtle`}
    >
      {initials}
    </span>
  );
}

/**
 * Mural dos Campeões: um cartão por ano (do mais recente ao primeiro).
 * Geral (event = null): todos os anos desde o primeiro, inclusive os sem
 * competição no estado. Por modalidade: só os anos em que ela foi disputada.
 */
export function ChampionsWall({ index, event, locale }: { index: RankingsIndex; event: string | null; locale: string }) {
  const t = useTranslations("rankings");
  const fmt = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), [locale]);

  const cards = useMemo(() => {
    const source = event ? (index.champions.byEvent[event] ?? []) : index.champions.overall;
    const byYear = new Map<number, ChampionEntry>(source.map((e) => [e.year, e]));
    if (event) return [...byYear.values()].sort((a, b) => b.year - a.year);
    const out: (ChampionEntry | { year: number; empty: true })[] = [];
    for (let y = index.currentYear; y >= index.firstYear; y--) out.push(byYear.get(y) ?? { year: y, empty: true });
    return out;
  }, [index, event]);

  return (
    <div className="mt-5">
      <p className="text-sm text-fg-muted">
        {event ? t("wallEventHint", { event: eventName(event, locale) }) : t("wallHint", { first: index.firstYear })}
      </p>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) =>
          "empty" in card ? (
            <li
              key={card.year}
              className="flex items-center gap-4 rounded-2xl border border-dashed border-border-subtle p-5 text-fg-muted"
            >
              <span className="font-display text-2xl font-bold">{card.year}</span>
              <span className="text-sm">
                {card.year === index.currentYear ? t("noResultsYet") : t("noCompetitionsYear")}
              </span>
            </li>
          ) : (
            <li key={card.year} className="rounded-2xl border border-border-subtle bg-bg-elevated p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-2xl font-bold">{card.year}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                    card.partial ? "border border-border-subtle text-link" : "bg-[#d4a017] text-black"
                  }`}
                  title={card.partial ? t("partialHint") : undefined}
                >
                  {card.partial ? t("leader") : card.champions.length > 1 ? t("championsTied") : t("champion")}
                </span>
              </div>
              <ul className="mt-4 space-y-3">
                {card.champions.map((c) => (
                  <li key={c.wcaId}>
                    <a
                      href={wcaProfileUrl(c.wcaId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("viewProfile")}
                      className="group flex items-center gap-4"
                    >
                      <Avatar c={c} />
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug group-hover:text-link">{c.name}</span>
                        <span className="mt-0.5 block font-mono text-xs text-fg-muted">
                          {fmt.format(c.points)} {t("pointsShort")} · {c.wcaId}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
