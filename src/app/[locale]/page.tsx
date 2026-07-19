import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { LogoMark } from "@/components/layout/logo";
import { getProximasCompeticoes, getUltimasNoticias } from "@/lib/supabase/queries";

/**
 * HOME — ISR de 1h: gerada uma vez, servida da borda para todos.
 * Pico de 50k acessos/dia ⇒ ~24 queries ao Supabase.
 */
export const revalidate = 3600;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const [competicoes, noticias] = await Promise.all([
    getProximasCompeticoes(),
    getUltimasNoticias(3),
  ]);

  return (
    <main>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Logo sutil ao fundo */}
        <LogoMark className="pointer-events-none absolute -right-24 top-1/2 size-[480px] -translate-y-1/2 opacity-[0.04]" />
        <div className="mx-auto flex min-h-[78dvh] max-w-6xl flex-col items-start justify-center gap-6 px-6">
          <span className="rounded-full border border-border-subtle px-3.5 py-1.5 text-xs font-medium text-fg-muted">
            {t("heroBadge")}
          </span>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight md:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-fg-muted">
            {t("heroSubtitle")}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="/competicoes"
              className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-fg transition hover:opacity-90"
            >
              {t("ctaCompetitions")}
            </Link>
            <Link
              href="/sobre"
              className="rounded-xl border border-border-subtle px-5 py-3 text-sm font-semibold text-fg transition hover:border-brand"
            >
              {t("ctaAbout")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Próximas competições ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">{t("upcomingCompetitions")}</h2>
        {competicoes.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-fg-muted">
            {t("noCompetitions")}
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-3">
            {competicoes.slice(0, 6).map((c) => (
              <li key={c.id}>
                <article className="group h-full rounded-2xl border border-border-subtle bg-bg-elevated p-6 transition hover:border-brand">
                  <h3 className="font-semibold">
                    {locale === "en" && c.titulo_en ? c.titulo_en : c.titulo}
                  </h3>
                  <p className="mt-1.5 font-mono text-sm text-fg-muted">
                    {c.cidade} · {c.data_inicio}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Institucional ────────────────────────────────────────── */}
      <section className="border-y border-border-subtle bg-bg-elevated/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2">
          <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
            {t("institutionalTitle")}
          </h2>
          <p className="leading-relaxed text-fg-muted">{t("institutionalText")}</p>
        </div>
      </section>

      {/* ── Últimas notícias ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">{t("latestNews")}</h2>
        {noticias.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-fg-muted">
            {t("noNews")}
          </p>
        ) : (
          <ul className="grid gap-5 md:grid-cols-3">
            {noticias.map((n) => (
              <li key={n.id}>
                <article className="h-full rounded-2xl border border-border-subtle bg-bg-elevated p-6 transition hover:border-brand">
                  <h3 className="font-semibold">
                    {locale === "en" && n.titulo_en ? n.titulo_en : n.titulo}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-fg-muted">
                    {locale === "en" && n.resumo_en ? n.resumo_en : n.resumo}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
