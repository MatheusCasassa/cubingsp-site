import type { CompetitionItem } from "@/lib/wca/competitions";
import { countryName, dateBadge, formatDateRange } from "@/lib/format-date";

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
 * `compact`: sem o botão lateral (Home, em colunas estreitas).
 */
export function CompetitionCard({
  c,
  locale,
  labels,
  showCountry = false,
  compact = false,
}: {
  c: CompetitionItem;
  locale: string;
  labels: CompetitionCardLabels;
  showCountry?: boolean;
  compact?: boolean;
}) {
  const badge = dateBadge(c.startDate, locale);

  const venueText = c.multiLocation
    ? c.venues
        .map((v) => (showCountry && v.country ? `${v.label} (${countryName(v.country, locale)})` : v.label))
        .join(" · ")
    : showCountry && c.country
      ? `${c.place}, ${countryName(c.country, locale)}`
      : c.place;

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

        {venueText && (
          <p className="mt-2 text-sm text-fg-muted">
            {c.multiLocation && <span className="font-medium text-fg">{labels.venues}: </span>}
            {venueText}
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
