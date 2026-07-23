"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  captureTokenFromUrl,
  clearToken,
  getManagedCompetitions,
  getMe,
  getWcif,
  isWcaToolConfigured,
  wcaAuthorizeUrl,
  type WcaManagedCompetition,
  type WcaMe,
} from "./wca-auth";
import { resolveRound } from "./scorecards/resolve";
import { generateScorecardsPdf } from "./scorecards/generate";
import { eventNamePt } from "./scorecards/format";
import type { WcifCompetition } from "./scorecards/types";

type Stage =
  | { s: "boot" }
  | { s: "not-configured" }
  | { s: "logged-out" }
  | { s: "checking" }
  | { s: "denied"; name: string }
  | { s: "pick-comp"; comps: WcaManagedCompetition[] }
  | { s: "loading-wcif"; comp: WcaManagedCompetition }
  | { s: "rounds"; comp: WcaManagedCompetition; wcif: WcifCompetition }
  | { s: "error"; message: string };

export function ScorecardsTool() {
  const t = useTranslations("scorecards");
  const [stage, setStage] = useState<Stage>({ s: "boot" });
  const [me, setMe] = useState<WcaMe | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [blankCounts, setBlankCounts] = useState<Record<string, number>>({});
  const [generating, setGenerating] = useState(false);

  /* Boot: captura token do hash / sessão e valida permissões */
  useEffect(() => {
    if (!isWcaToolConfigured()) {
      setStage({ s: "not-configured" });
      return;
    }
    const tk = captureTokenFromUrl();
    if (!tk) {
      setStage({ s: "logged-out" });
      return;
    }
    setToken(tk);
    setStage({ s: "checking" });
    (async () => {
      try {
        const [meData, comps] = await Promise.all([
          getMe(tk),
          getManagedCompetitions(tk),
        ]);
        setMe(meData);
        // Permissão: Delegado WCA OU Organizador/Delegado de alguma competição
        if (!meData.delegate_status && comps.length === 0) {
          setStage({ s: "denied", name: meData.name });
          return;
        }
        setStage({ s: "pick-comp", comps });
      } catch {
        clearToken();
        setStage({ s: "logged-out" });
      }
    })();
  }, []);

  async function openComp(comp: WcaManagedCompetition) {
    if (!token) return;
    setStage({ s: "loading-wcif", comp });
    try {
      const wcif = await getWcif<WcifCompetition>(token, comp.id);
      setSelected({});
      setBlankCounts({});
      setStage({ s: "rounds", comp, wcif });
    } catch {
      setStage({ s: "error", message: t("wcifError") });
    }
  }

  const roundsInfo = useMemo(() => {
    if (stage.s !== "rounds") return [];
    return stage.wcif.events
      .filter((e) => e.id !== "333fm") // FMC não usa súmula de tempo
      .flatMap((e) =>
        e.rounds.map((r) => {
          const n = parseInt(r.id.split("-r")[1], 10);
          const competitors =
            n === 1
              ? stage.wcif.persons.filter(
                  (p) =>
                    p.registration?.status === "accepted" &&
                    p.registration.eventIds.includes(e.id)
                ).length
              : null;
          return { id: r.id, eventId: e.id, round: n, competitors };
        })
      );
  }, [stage]);

  async function generate() {
    if (stage.s !== "rounds") return;
    setGenerating(true);
    try {
      const rounds = roundsInfo
        .filter((r) => selected[r.id])
        .map((r) =>
          resolveRound(stage.wcif, r.id, {
            blankCount: r.round > 1 ? (blankCounts[r.id] ?? 16) : undefined,
          })
        );
      const pdf = await generateScorecardsPdf(rounds);
      const blob = new Blob([pdf as unknown as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sumulas-${stage.comp.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  /* ── Render ─────────────────────────────────────────────────── */

  const card = "rounded-2xl border border-border-subtle bg-bg-elevated p-6";
  const btn =
    "rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg transition hover:opacity-90 disabled:opacity-50";

  if (stage.s === "boot") return <p className="text-fg-muted">…</p>;

  if (stage.s === "not-configured")
    return <p className={`${card} text-center text-fg-muted`}>{t("notConfigured")}</p>;

  if (stage.s === "logged-out")
    return (
      <div className={`${card} flex flex-col items-center gap-4 text-center`}>
        <p className="max-w-md text-sm text-fg-muted">{t("loginHint")}</p>
        <a href={wcaAuthorizeUrl()} className={btn}>
          {t("loginCta")}
        </a>
      </div>
    );

  if (stage.s === "checking")
    return <p className="animate-pulse text-fg-muted">{t("checking")}</p>;

  if (stage.s === "denied")
    return (
      <div className={`${card} text-center`}>
        <p className="font-semibold text-accent-red-soft">{t("deniedTitle")}</p>
        <p className="mt-2 text-sm text-fg-muted">{t("deniedText", { name: stage.name })}</p>
      </div>
    );

  if (stage.s === "error")
    return <p className={`${card} text-center text-accent-red-soft`}>{stage.message}</p>;

  if (stage.s === "pick-comp")
    return (
      <div className="space-y-4">
        {me && (
          <p className="text-sm text-fg-muted">
            {t("hello", { name: me.name })}
            {me.delegate_status && (
              <span className="ml-2 rounded-full border border-border-subtle px-2 py-0.5 text-xs font-semibold">
                {t("delegateBadge")}
              </span>
            )}
          </p>
        )}
        <h2 className="text-lg font-bold">{t("pickComp")}</h2>
        {stage.comps.length === 0 ? (
          <p className={`${card} text-center text-fg-muted`}>{t("noComps")}</p>
        ) : (
          <ul className="grid gap-3">
            {stage.comps.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openComp(c)}
                  className={`${card} w-full text-left transition hover:border-brand`}
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="mt-0.5 block font-mono text-xs text-fg-muted">
                    {c.city} · {c.start_date}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );

  if (stage.s === "loading-wcif")
    return (
      <p className="animate-pulse text-fg-muted">
        {t("loadingWcif", { name: stage.comp.name })}
      </p>
    );

  /* rounds */
  const anySelected = roundsInfo.some((r) => selected[r.id]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">{stage.comp.name}</h2>
          <p className="text-sm text-fg-muted">{t("pickRounds")}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!token) return;
            setStage({ s: "checking" });
            const comps = await getManagedCompetitions(token);
            setStage({ s: "pick-comp", comps });
          }}
          className="text-sm font-semibold text-brand hover:underline"
        >
          ← {t("back")}
        </button>
      </div>

      <ul className="grid gap-2">
        {roundsInfo.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3"
          >
            <label className="flex flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={!!selected[r.id]}
                onChange={(e) => setSelected({ ...selected, [r.id]: e.target.checked })}
                className="size-4 accent-[--brand]"
              />
              <span className="text-sm font-medium">
                {eventNamePt(r.eventId)} — {t("round")} {r.round}
              </span>
            </label>
            {r.competitors != null ? (
              <span className="font-mono text-xs text-fg-muted">
                {t("competitorsCount", { count: r.competitors })}
              </span>
            ) : (
              <label className="flex items-center gap-2 font-mono text-xs text-fg-muted">
                {t("blankCards")}
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={blankCounts[r.id] ?? 16}
                  onChange={(e) =>
                    setBlankCounts({ ...blankCounts, [r.id]: parseInt(e.target.value || "0", 10) })
                  }
                  className="w-16 rounded-lg border border-border-subtle bg-bg px-2 py-1 text-right"
                />
              </label>
            )}
          </li>
        ))}
      </ul>

      <button type="button" disabled={!anySelected || generating} onClick={generate} className={btn}>
        {generating ? t("generating") : t("generateCta")}
      </button>
    </div>
  );
}
