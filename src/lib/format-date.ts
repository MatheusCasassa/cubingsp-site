/** Formatação de datas de competições conforme o idioma do site. */

const INTL_LOCALE: Record<string, string> = { pt: "pt-BR", en: "en-US", es: "es" };

export function intlLocale(locale: string): string {
  return INTL_LOCALE[locale] ?? "pt-BR";
}

/** Datas da WCA são dias (YYYY-MM-DD), sem fuso: tratamos como UTC. */
function day(d: string): Date {
  return new Date(`${d}T00:00:00Z`);
}

/** "24 de out. de 2026" ou "31 de out. – 2 de nov. de 2026". */
export function formatDateRange(start: string, end: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(intlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  return start === end ? fmt.format(day(start)) : fmt.formatRange(day(start), day(end));
}

/** Partes para o bloco de data do cartão: dia e mês abreviado. */
export function dateBadge(start: string, locale: string): { day: string; month: string } {
  const d = day(start);
  const loc = intlLocale(locale);
  return {
    day: new Intl.DateTimeFormat(loc, { day: "numeric", timeZone: "UTC" }).format(d),
    month: new Intl.DateTimeFormat(loc, { month: "short", timeZone: "UTC" })
      .format(d)
      .replace(".", ""),
  };
}

/** Nome do país no idioma do site (ISO2 → "Argentina"). */
export function countryName(iso2: string, locale: string): string {
  try {
    return new Intl.DisplayNames([intlLocale(locale)], { type: "region" }).of(iso2) ?? iso2;
  } catch {
    return iso2;
  }
}
