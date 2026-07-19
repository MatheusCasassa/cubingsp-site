import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";

// Página 100% estática (SSG) — custo zero de Worker e de banco.
export const dynamic = "force-static";

export const metadata: Metadata = { title: "Ferramentas" };

const TOOLS = [
  { key: "scorecards", icon: "🗂️" },
  { key: "rankings", icon: "🏆" },
  { key: "delegate", icon: "🛠️" },
] as const;

export default async function FerramentasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tools");

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-fg-muted">{t("subtitle")}</p>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {TOOLS.map(({ key, icon }) => (
          <li key={key}>
            <article className="relative h-full rounded-2xl border border-border-subtle bg-bg-elevated p-6">
              <span className="absolute right-4 top-4 rounded-full border border-border-subtle px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-fg-muted">
                {t("comingSoon")}
              </span>
              <span className="text-2xl" aria-hidden>{icon}</span>
              <h2 className="mt-4 font-semibold">{t(`${key}Title`)}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t(`${key}Text`)}</p>
            </article>
          </li>
        ))}
      </ul>
    </main>
  );
}
