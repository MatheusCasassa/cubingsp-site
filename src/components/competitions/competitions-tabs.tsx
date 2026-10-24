"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { CompetitionItem } from "@/lib/wca/competitions";
import { countryName } from "@/lib/format-date";
import { CompetitionCard, type CompetitionCardLabels } from "./competition-card";

type Region = "sp" | "brasil" | "latam";
const REGIONS: Region[] = ["sp", "brasil", "latam"];

export interface CompetitionsTabsLabels {
  tabs: Record<Region, string>;
  hints: Record<Region, string>;
  country: string; // "País"
  allCountries: string; // "Todos os países"
  empty: string;
  card: CompetitionCardLabels;
}

/**
 * Abas São Paulo / Brasil / LATAM (+ filtro de país na LATAM).
 * Troca no navegador e guarda a aba no endereço (#sp, #brasil, #latam),
 * então a página continua estática/ISR e o link pode ser compartilhado.
 */
export function CompetitionsTabs({
  data,
  latamCountries,
  locale,
  labels,
}: {
  data: Record<Region, CompetitionItem[]>;
  latamCountries: string[];
  locale: string;
  labels: CompetitionsTabsLabels;
}) {
  const t = useTranslations("competitions");
  const [region, setRegion] = useState<Region>("sp");
  const [country, setCountry] = useState<string>("");

  // Aba inicial a partir do #hash
  useEffect(() => {
    const h = window.location.hash.replace("#", "") as Region;
    if (REGIONS.includes(h)) setRegion(h);
  }, []);

  function select(r: Region) {
    setRegion(r);
    history.replaceState(null, "", `#${r}`);
  }

  const list = useMemo(() => {
    const items = data[region];
    if (region !== "latam" || !country) return items;
    return items.filter((c) => c.countries.includes(country));
  }, [data, region, country]);

  const countryOptions = useMemo(
    () =>
      latamCountries
        .map((iso) => ({ iso, name: countryName(iso, locale) }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [latamCountries, locale],
  );

  return (
    <div>
      {/* Abas */}
      <div role="tablist" className="flex gap-1 rounded-xl border border-border-subtle bg-bg-elevated p-1 sm:inline-flex">
        {REGIONS.map((r) => (
          <button
            key={r}
            role="tab"
            type="button"
            aria-selected={region === r}
            onClick={() => select(r)}
            className={`flex-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold transition sm:flex-none sm:px-4 ${
              region === r ? "bg-brand text-brand-fg" : "text-fg-muted hover:text-fg"
            }`}
          >
            {labels.tabs[r]}
            <span className={`ml-1.5 font-mono text-xs ${region === r ? "opacity-80" : "opacity-60"}`}>
              {data[r].length}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          {labels.hints[region]} · {t("count", { count: list.length })}
        </p>

        {region === "latam" && (
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">{labels.country}</span>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-1.5 text-sm outline-none focus:border-brand"
            >
              <option value="">{labels.allCountries}</option>
              {countryOptions.map((o) => (
                <option key={o.iso} value={o.iso}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border-subtle p-10 text-center text-fg-muted">
          {labels.empty}
        </p>
      ) : (
        <ul className="mt-6 grid gap-3">
          {list.map((c) => (
            <li key={`${region}-${c.id}`}>
              <CompetitionCard c={c} locale={locale} labels={labels.card} showCountry={region === "latam"} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
