"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import type { RankingsIndex, YearFile } from "@/lib/rankings/types";
import { sortEvents } from "@/lib/rankings/events";
import { RankingTable } from "./ranking-table";
import { ChampionsWall } from "./champions-wall";
import { EventPicker } from "./event-picker";

/**
 * Ranking Estadual: abas "Ranking" e "Mural dos Campeões", cada uma com a
 * visão Geral e Por modalidade. Tudo no navegador; o estado fica no endereço
 * para poder compartilhar o link:
 *   #ranking/2025          ranking geral de 2025
 *   #ranking/2025/333      ranking de 3x3x3 em 2025
 *   #campeoes              mural geral
 *   #campeoes/333          mural do 3x3x3
 * O ranking completo de cada ano é um JSON estático em /data/rankings/<ano>.json,
 * baixado só quando o ano é escolhido.
 */

type View = "ranking" | "campeoes";
interface State {
  view: View;
  year: number;
  event: string | null; // null = Geral
}

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
const getHash = () => window.location.hash;
const getServerHash = () => "";

function parse(hash: string, currentYear: number): State {
  const [view, a, b] = hash.replace(/^#/, "").split("/");
  if (view === "campeoes") return { view, year: currentYear, event: a || null };
  const year = Number(a);
  return {
    view: "ranking",
    year: Number.isInteger(year) && year >= 2000 && year <= currentYear ? year : currentYear,
    event: b || null,
  };
}

function serialize(s: State): string {
  if (s.view === "campeoes") return s.event ? `#campeoes/${s.event}` : "#campeoes";
  return s.event ? `#ranking/${s.year}/${s.event}` : `#ranking/${s.year}`;
}

const yearCache = new Map<string, Promise<YearFile>>();
function loadYear(year: number, version: string): Promise<YearFile> {
  const key = `${year}:${version}`;
  let p = yearCache.get(key);
  if (!p) {
    p = fetch(`/data/rankings/${year}.json?v=${version}`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json() as Promise<YearFile>;
    });
    p.catch(() => yearCache.delete(key)); // permite tentar de novo
    yearCache.set(key, p);
  }
  return p;
}

export function RankingsView({ index, locale }: { index: RankingsIndex; locale: string }) {
  const t = useTranslations("rankings");
  const hash = useSyncExternalStore(subscribeHash, getHash, getServerHash);
  const state = parse(hash, index.currentYear);
  const [lastYear, setLastYear] = useState(index.currentYear); // ano ao voltar do mural

  function go(next: Partial<State>) {
    const s = { ...state, ...next };
    if (s.view === "ranking") setLastYear(s.year);
    history.replaceState(null, "", serialize(s));
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }

  const yearsWithData = useMemo(() => new Map(index.years.map((y) => [y.year, y])), [index.years]);
  const summary = yearsWithData.get(state.year);

  // Ranking do ano escolhido
  const [files, setFiles] = useState<Record<number, YearFile>>({});
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const [retry, setRetry] = useState(0);
  const needsYear = state.view === "ranking" && !!summary;
  const file = files[state.year];
  useEffect(() => {
    if (!needsYear || file) return;
    let alive = true;
    loadYear(state.year, index.version)
      .then((f) => alive && setFiles((m) => ({ ...m, [f.year]: f })))
      .catch(() => alive && setFailed((m) => ({ ...m, [state.year]: true })));
    return () => {
      alive = false;
    };
  }, [needsYear, file, state.year, index.version, retry]);

  const yearOptions = useMemo(() => {
    const out: number[] = [];
    for (let y = index.currentYear; y >= index.firstYear; y--) out.push(y);
    return out;
  }, [index.currentYear, index.firstYear]);

  const championEvents = useMemo(() => sortEvents(Object.keys(index.champions.byEvent)), [index.champions.byEvent]);
  const yearEvents = useMemo(() => (file ? sortEvents(file.events) : []), [file]);

  // Modalidade válida para a visão atual (cai na primeira disponível)
  const rankingEvent =
    state.event && (yearEvents.length === 0 || yearEvents.includes(state.event)) ? state.event : (yearEvents[0] ?? state.event);
  const wallEvent = state.event && championEvents.includes(state.event) ? state.event : championEvents[0];

  const tabBtn = (active: boolean) =>
    `flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition sm:flex-none sm:px-5 ${
      active ? "bg-brand text-brand-fg" : "text-fg-muted hover:text-fg"
    }`;
  const modeBtn = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
      active ? "border-brand bg-brand/10 text-link" : "border-border-subtle text-fg-muted hover:border-brand hover:text-fg"
    }`;

  return (
    <div>
      {/* Abas principais */}
      <div role="tablist" className="flex gap-1 rounded-xl border border-border-subtle bg-bg-elevated p-1 sm:inline-flex">
        <button
          role="tab"
          type="button"
          aria-selected={state.view === "ranking"}
          onClick={() => state.view !== "ranking" && go({ view: "ranking", year: lastYear, event: null })}
          className={tabBtn(state.view === "ranking")}
        >
          {t("tabRanking")}
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={state.view === "campeoes"}
          onClick={() => state.view !== "campeoes" && go({ view: "campeoes", event: null })}
          className={tabBtn(state.view === "campeoes")}
        >
          {t("tabChampions")}
        </button>
      </div>

      {/* Geral / Por modalidade + ano */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label={t("viewMode")}>
          <button type="button" aria-pressed={!state.event} onClick={() => go({ event: null })} className={modeBtn(!state.event)}>
            {state.view === "ranking" ? t("modeOverall") : t("wallOverall")}
          </button>
          <button
            type="button"
            aria-pressed={!!state.event}
            onClick={() => go({ event: state.view === "ranking" ? (rankingEvent ?? "333") : (wallEvent ?? "333") })}
            className={modeBtn(!!state.event)}
          >
            {state.view === "ranking" ? t("modeEvent") : t("wallEvent")}
          </button>
        </div>

        {state.view === "ranking" && (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">{t("year")}</span>
            <select
              value={state.year}
              onChange={(e) => go({ year: Number(e.target.value) })}
              className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-1.5 font-semibold transition hover:border-brand"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y} disabled={!yearsWithData.has(y) && y !== index.currentYear}>
                  {yearsWithData.has(y) || y === index.currentYear ? y : `${y} — ${t("noCompetitionsShort")}`}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {state.view === "ranking" ? (
        <section className="mt-6">
          {state.event && yearEvents.length > 0 && (
            <EventPicker events={yearEvents} value={rankingEvent!} onChange={(ev) => go({ event: ev })} locale={locale} />
          )}

          {!summary ? (
            <p className="mt-6 rounded-2xl border border-dashed border-border-subtle p-10 text-center text-fg-muted">
              {t("emptyYear", { year: state.year })}
            </p>
          ) : failed[state.year] && !file ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border-subtle p-10 text-center text-fg-muted">
              <p>{t("error")}</p>
              <button
                type="button"
                onClick={() => {
                  setFailed((m) => ({ ...m, [state.year]: false }));
                  setRetry((n) => n + 1);
                }}
                className="mt-3 rounded-lg border border-border-subtle px-3 py-1.5 text-sm font-semibold hover:border-brand"
              >
                {t("retry")}
              </button>
            </div>
          ) : !file ? (
            <div className="mt-6 space-y-2" aria-busy="true" aria-label={t("loading")}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} className="h-11 animate-pulse rounded-lg bg-bg-elevated" />
              ))}
            </div>
          ) : (
            <RankingTable
              key={`${state.year}-${rankingEvent ?? "geral"}`}
              file={file}
              event={state.event ? rankingEvent! : null}
              locale={locale}
            />
          )}
        </section>
      ) : (
        <section className="mt-6">
          {state.event && wallEvent && (
            <EventPicker events={championEvents} value={wallEvent} onChange={(ev) => go({ event: ev })} locale={locale} />
          )}
          <ChampionsWall index={index} event={state.event ? (wallEvent ?? null) : null} locale={locale} />
        </section>
      )}
    </div>
  );
}
