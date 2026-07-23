import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ScorecardsTool } from "@/modules/delegate-tools/scorecards-tool";

/**
 * Página 100% estática: o shell é SSG e toda a lógica (OAuth WCA,
 * API, geração de PDF) roda no navegador — custo de servidor zero.
 * É também a redirect URI do OAuth (o token volta no #fragment).
 */
export const dynamic = "force-static";

export const metadata: Metadata = { title: "Súmulas" };

export default async function SumulasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("scorecards");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-black tracking-tight">{t("title")}</h1>
      <p className="mt-3 max-w-xl leading-relaxed text-fg-muted">{t("subtitle")}</p>
      <div className="mt-10">
        <ScorecardsTool />
      </div>
    </main>
  );
}
