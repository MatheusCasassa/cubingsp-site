import type { CompetitionItem } from "@/lib/wca/competitions";
import { countryName, dateBadge, formatDateRange } from "@/lib/format-date";
import { CityFlag, CountryFlag, StateFlag } from "@/components/ui/region-flag";

export interface CompetitionCardLabels {
  fm: string; // "FM"
  fmTitle: string; // "Somente 3x3x3 Menos Movimentos"
  multi: string; // "Várias sedes"
  venues: string; // "Sedes"
  viewOnWca: string; // "Ver na WCA"
}

/**
 * Cartão de competição (usado na Home e na página de Competições).
 * Sem hooks: funciona em Server e Client Components.
 * `showCountry`: mostra o país (aba LATAM).
 * `flags`: bandeira do município (aba São Paulo e Home; sem bandeira, a do
 * estado), do estado (aba Brasil) ou do país (aba LATAM) em cada sede.
 * `compact`: sem o botão lateral (Home, em colunas estreitas).
 */
export function CompetitionCard({
  c,
  locale,
  labels,
  showCountry = false,
  compact = false,
  flags,
}: {
  c: CompetitionItem;
  locale: string;
  labels: CompetitionCardLabels;
  showCountry?: boolean;
  compact?: boolean;
  flags?: "city" | "state" | "country";
}) {
  const badge = dateBadge(c.startDate, locale);

  const withCountry = (label: string, country: string | null) =>
    showCountry && country ? `${label}, ${countryName(country, locale)}` : label;

  // Locais exibidos: as sedes desta região (várias sedes) ou o local único
  const places = c.multiLocation
    ? c.venues.map((v) => ({
        label: withCountry(v.label, v.country),
        uf: v.uf,
        country: v.country,
        cityFlag: v.cityFlag ?? null,
      }))
    : c.place
      ? [{ label: withCountry(c.place, c.country), uf: c.uf, country: c.country, cityFlag: c.cityFlag ?? null }]
      : [];

  const flagFor = (p: { label: string; uf: string | null; country: string | null; cityFlag: string | null }) =>
    flags === "city" && p.cityFlag ? (
      <CityFlag ibge={p.cityFlag} name={p.label.split("/")[0]} />
    ) : (flags === "state" || flags === "city") && p.uf ? (
      <StateFlag uf={p.uf} />
    ) : flags === "country" && p.country ? (
      <CountryFlag iso={p.country} locale={locale} />
    ) : null;

  return (
    <article className="flex h-full items-start gap-4 rounded-2xl border border-border-subtle bg-bg-elevated p-5 transition hover:border-brand">
      {/* Bloco de data */}
      <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-bg py-2 text-center">
        <span className="font-display text-2xl font-bold leading-none">{badge.day}</span>
        <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
          {badge.month}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug">
          <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-link">
            {c.name}
          </a>
        </h3>
        <p className="mt-1 text-xs text-fg-muted">
          {formatDateRange(c.startDate, c.endDate, locale)}
        </p>

        {(c.fmOnly || c.multiLocation) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.fmOnly && (
              <span
                title={labels.fmTitle}
                className="rounded-full border border-logo-red/50 px-2 py-0.5 text-[11px] font-bold text-danger"
              >
                {labels.fm}
              </span>
            )}
            {c.multiLocation && (
              <span className="rounded-full border border-border-subtle px-2 py-0.5 text-[11px] font-semibold text-link">
                {labels.multi}
              </span>
            )}
          </div>
        )}

        {places.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-muted">
            {c.multiLocation && <span className="font-medium text-fg">{labels.venues}:</span>}
            {places.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5">
                {flagFor(p)}
                {p.label}
              </span>
            ))}
          </p>
        )}
      </div>

      {!compact && (
      <a
        href={c.url}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden shrink-0 self-center rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold transition hover:border-brand sm:block"
      >
        {labels.viewOnWca} ↗
      </a>
      )}
    </article>
  );
}
