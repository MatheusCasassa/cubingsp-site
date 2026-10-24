import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getCompetitionsByRegion } from "@/lib/wca/competitions";
import { CompetitionsTabs } from "@/components/competitions/competitions-tabs";

/**
 * Próximas competições (API da WCA) em abas São Paulo / Brasil / LATAM.
 * ISR de 1h: os dados vêm do cache (getCompetitionsByRegion) e a troca de
 * aba/país acontece no navegador — nenhuma requisição dinâmica extra.
 */
export const revalidate = 3600;

export const metadata: Metadata = { title: "Competições" };

export default async function CompeticoesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("competitions");
  const comps = await getCompetitionsByRegion();
  const data = { sp: comps.sp, brasil: comps.br, latam: comps.latam };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 md:py-20">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-fg-muted">{t("subtitle")}</p>

      <div className="mt-10">
        <CompetitionsTabs
          data={data}
          latamCountries={comps.latamCountries}
          locale={locale}
          labels={{
            tabs: { sp: t("tabSp"), brasil: t("tabBrasil"), latam: t("tabLatam") },
            hints: { sp: t("hintSp"), brasil: t("hintBrasil"), latam: t("hintLatam") },
            country: t("country"),
            allCountries: t("allCountries"),
            empty: t("empty"),
            card: {
              fm: t("fm"),
              fmTitle: t("fmTitle"),
              multi: t("multi"),
              venues: t("venues"),
              viewOnWca: t("viewOnWca"),
            },
          }}
        />
      </div>

      <div className="mt-10 space-y-1 border-t border-border-subtle pt-6 text-xs leading-relaxed text-fg-muted">
        <p>{t("multiNote")}</p>
        <p>{t("source")}</p>
      </div>
    </main>
  );
}
