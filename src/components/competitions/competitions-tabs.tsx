"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import type { CompetitionItem } from "@/lib/wca/competitions";
import { countryName } from "@/lib/format-date";
import { CompetitionCard, type CompetitionCardLabels } from "./competition-card";
import { CountryFilter } from "./country-filter";

type Region = "sp" | "brasil" | "latam";
const REGIONS: Region[] = ["sp", "brasil", "latam"];

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}
function regionFromHash(): Region {
  const h = window.location.hash.replace("#", "") as Region;
  return REGIONS.includes(h) ? h : "sp";
}

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
  // Aba do #hash (no servidor, "sp"); um clique numa aba tem prioridade
  const hashRegion = useSyncExternalStore(subscribeHash, regionFromHash, () => "sp" as Region);
  const [picked, setPicked] = useState<Region | null>(null);
  const region = picked ?? hashRegion;
  const [country, setCountry] = useState<string>("");

  function select(r: Region) {
    setPicked(r);
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
        .map((iso) => ({
          iso,
          name: countryName(iso, locale),
          count: data.latam.filter((c) => c.countries.includes(iso)).length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [latamCountries, locale, data.latam],
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
          <CountryFilter
            value={country}
            onChange={setCountry}
            options={countryOptions}
            locale={locale}
            label={labels.country}
            allLabel={labels.allCountries}
            totalCount={data.latam.length}
          />
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
              <CompetitionCard
                c={c}
                locale={locale}
                labels={labels.card}
                showCountry={region === "latam"}
                flags={region === "brasil" ? "state" : region === "latam" ? "country" : "city"}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
