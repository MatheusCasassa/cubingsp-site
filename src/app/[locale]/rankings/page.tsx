import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { RankingsView } from "@/components/rankings/rankings-view";
import { intlLocale } from "@/lib/format-date";
import type { RankingsIndex } from "@/lib/rankings/types";
import indexData from "@/data/rankings/index.json";

/**
 * Ranking Estadual (método APS, o mesmo do RASCS).
 * Página estática: os dados são gerados pela GitHub Action semanal
 * (scripts/rankings/build-rankings.mjs), que faz commit e dispara o deploy.
 * O ranking completo de cada ano é baixado pelo navegador como arquivo
 * estático (/data/rankings/<ano>.json) — não passa pelo Worker.
 */
export const dynamic = "force-static";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rankings" });
  return { title: t("title"), description: t("text") };
}

export default async function RankingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rankings");
  const index = indexData as RankingsIndex;

  const updated = new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${index.updatedAt}T12:00:00Z`),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-20">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-fg-muted">{t("text")}</p>

      <div className="mt-6 max-w-2xl rounded-2xl border border-border-subtle bg-bg-elevated p-4 text-sm leading-relaxed">
        <p className="font-semibold">{t("howTitle")}</p>
        <p className="mt-1 text-fg-muted">{t("howText")}</p>
        <p className="mt-2 font-mono text-fg">{t("formula")}</p>
      </div>

      <div className="mt-10">
        <RankingsView index={index} locale={locale} />
      </div>

      <div className="mt-12 space-y-1 border-t border-border-subtle pt-6 text-xs leading-relaxed text-fg-muted">
        <p>{t("scope")}</p>
        <p>{t("credits")}</p>
        <p>{t("attribution", { date: updated })}</p>
      </div>
    </main>
  );
}
