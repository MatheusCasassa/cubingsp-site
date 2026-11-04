"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { rank, wcaProfileUrl, type YearFile } from "@/lib/rankings/types";
import { eventName } from "@/lib/rankings/events";

const PAGE = 100;

/** Minúsculas e sem acentos, para a busca por nome. */
const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const MEDAL = ["bg-[#d4a017] text-black", "bg-[#a8adb4] text-black", "bg-[#b87333] text-white"];

/**
 * Tabela do ranking de um ano: geral (event = null) ou de uma modalidade.
 * Busca por nome e "Mostrar mais" de 100 em 100 (anos com ~800 pessoas).
 */
export function RankingTable({ file, event, locale }: { file: YearFile; event: string | null; locale: string }) {
  const t = useTranslations("rankings");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const rows = useMemo(() => {
    const list = file.people
      .map(([wcaId, name, total, comps, events]) => ({
        wcaId,
        name,
        comps,
        points: event ? (events[event] ?? null) : total,
      }))
      .filter((r): r is typeof r & { points: number } => r.points != null);
    if (event) list.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "pt"));
    return rank(list);
  }, [file, event]);

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    return q ? rows.filter((r) => fold(r.name).includes(q) || r.wcaId.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const fmt = useMemo(() => new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), [locale]);
  const shown = filtered.slice(0, limit);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          {event && <span className="font-semibold text-fg">{eventName(event, locale)} · </span>}
          {t("summary", { competitions: file.competitions.length, competitors: rows.length })}
          {file.partial && <span className="ml-2 rounded-full border border-border-subtle px-2 py-0.5 text-[11px] font-semibold text-link">{t("partial")}</span>}
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE);
          }}
          placeholder={t("search")}
          aria-label={t("search")}
          className="w-full rounded-lg border border-border-subtle bg-bg-elevated px-3 py-1.5 text-sm outline-none transition placeholder:text-fg-muted focus:border-brand sm:w-64"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border-subtle p-10 text-center text-fg-muted">{t("noMatch")}</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle">
          <table className="w-full text-sm">
            <thead className="bg-bg-elevated text-left text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th scope="col" className="w-14 px-3 py-2.5 text-center">#</th>
                <th scope="col" className="px-3 py-2.5">{t("competitor")}</th>
                {!event && <th scope="col" className="hidden px-3 py-2.5 text-right sm:table-cell">{t("competitions")}</th>}
                <th scope="col" className="px-3 py-2.5 text-right">{t("points")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {shown.map((r) => (
                <tr key={r.wcaId} className="transition hover:bg-bg-elevated">
                  <td className="px-3 py-2 text-center">
                    {r.rank <= 3 ? (
                      <span className={`inline-flex size-7 items-center justify-center rounded-full font-mono text-xs font-bold ${MEDAL[r.rank - 1]}`}>
                        {r.rank}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-fg-muted">{r.rank}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <a
                      href={wcaProfileUrl(r.wcaId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={t("viewProfile")}
                      className={`hover:text-link ${r.rank <= 3 ? "font-semibold" : ""}`}
                    >
                      {r.name}
                    </a>
                  </td>
                  {!event && <td className="hidden px-3 py-2 text-right font-mono text-xs text-fg-muted sm:table-cell">{r.comps}</td>}
                  <td className="px-3 py-2 text-right font-mono font-semibold tabular-nums">{fmt.format(r.points)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > shown.length && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-semibold transition hover:border-brand"
          >
            {t("showMore", { count: Math.min(PAGE, filtered.length - shown.length), total: filtered.length })}
          </button>
        </div>
      )}

      <details className="mt-6 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3 text-sm">
        <summary className="cursor-pointer font-semibold">{t("competitionsOfYear", { year: file.year, count: file.competitions.length })}</summary>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {file.competitions.map((c) => (
            <li key={c.id} className="text-fg-muted">
              <a href={`https://www.worldcubeassociation.org/competitions/${c.id}`} target="_blank" rel="noopener noreferrer" className="hover:text-link">
                {c.name}
              </a>{" "}
              <span className="text-xs">· {c.city}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
