import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

// Página 100% estática (SSG) — custo zero de Worker e de banco.
export const dynamic = "force-static";

export const metadata: Metadata = { title: "Ferramentas" };

export default async function FerramentasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("tools");

  const cardCls =
    "relative h-full rounded-2xl border border-border-subtle bg-bg-elevated p-6";

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-fg-muted">{t("subtitle")}</p>

      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {/* Súmulas — DISPONÍVEL */}
        <li>
          <Link href="/ferramentas/sumulas" className={`${cardCls} block transition hover:border-brand`}>
            <span className="absolute right-4 top-4 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-fg">
              {t("available")}
            </span>
            <span className="text-2xl" aria-hidden>🗂️</span>
            <h2 className="mt-4 font-semibold">{t("scorecardsTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("scorecardsText")}</p>
          </Link>
        </li>

        {/* Rankings — em breve */}
        <li>
          <article className={cardCls}>
            <span className="absolute right-4 top-4 rounded-full border border-border-subtle px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-fg-muted">
              {t("comingSoon")}
            </span>
            <span className="text-2xl" aria-hidden>🏆</span>
            <h2 className="mt-4 font-semibold">{t("rankingsTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("rankingsText")}</p>
          </article>
        </li>

        {/* Painel do delegado — em breve */}
        <li>
          <article className={cardCls}>
            <span className="absolute right-4 top-4 rounded-full border border-border-subtle px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-fg-muted">
              {t("comingSoon")}
            </span>
            <span className="text-2xl" aria-hidden>🛠️</span>
            <h2 className="mt-4 font-semibold">{t("delegateTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">{t("delegateText")}</p>
          </article>
        </li>
      </ul>
    </main>
  );
}
