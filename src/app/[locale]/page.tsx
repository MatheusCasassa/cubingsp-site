import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ImageSlot } from "@/components/ui/image-slot";
import { getUltimasNoticias } from "@/lib/supabase/queries";
import { getCompetitionsByRegion } from "@/lib/wca/competitions";
import { CompetitionCard } from "@/components/competitions/competition-card";

/**
 * HOME — ISR de 1h: gerada uma vez, servida da borda para todos.
 * Pico de 50k acessos/dia ⇒ ~24 queries ao Supabase.
 */
export const revalidate = 3600;

// Fotos da comunidade (galeria)
const GALERIA = [3, 4, 5, 6];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tc = await getTranslations("competitions");
  const [competicoes, noticias] = await Promise.all([
    getCompetitionsByRegion(),
    getUltimasNoticias(3),
  ]);
  // Resumo da Home: só o estado de São Paulo, as 3 próximas
  const proximasSp = competicoes.sp.slice(0, 3);
  const totalSp = competicoes.sp.length;

  return (
    <main>
      {/* ── Hero (título + foto panorâmica da comunidade) ────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-12 pb-16 md:pt-16">
        <div className="grid items-end gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            {t("heroTitle")}
          </h1>
          <div className="flex flex-col items-start gap-5">
          <p className="text-lg leading-relaxed text-fg-muted">
            {t("heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
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
        </div>

        {/* Foto principal: Cuber Brasil Sumaré 2026 (panorâmica, largura total) */}
        <div className="relative mt-10 md:mt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero.jpg"
            alt="Competidores reunidos no palco do Cuber Brasil Sumaré 2026"
            className="aspect-[4/3] w-full rounded-3xl border border-border-subtle object-cover shadow-2xl sm:aspect-[2/1]"
            fetchPriority="high"
          />
          {/* Selo redondo da logo (fundo azul, cubo ampliado como no avatar do Instagram) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/cubingsp-selo-redondo.svg"
            alt=""
            aria-hidden
            className="absolute -bottom-8 left-6 hidden size-24 rounded-full shadow-xl ring-4 ring-bg sm:block md:size-28"
          />
        </div>
      </section>

      {/* ── Próximas competições (estado de SP, 3 próximas) ──────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">{t("upcomingCompetitions")}</h2>
        {proximasSp.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border-subtle p-8 text-center text-fg-muted">
            {t("noCompetitions")}
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-3">
            {proximasSp.map((c) => (
              <li key={c.id}>
                <CompetitionCard
                  c={c}
                  locale={locale}
                  compact
                  labels={{
                    fm: tc("fm"),
                    fmTitle: tc("fmTitle"),
                    multi: tc("multi"),
                    venues: tc("venues"),
                    viewOnWca: tc("viewOnWca"),
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        {totalSp > 3 && (
          <div className="mt-6">
            <Link
              href="/competicoes"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-semibold transition hover:border-brand"
            >
              {t("seeAllCompetitions", { count: totalSp })} →
            </Link>
          </div>
        )}
      </section>

      {/* ── Institucional (texto + foto) ─────────────────────────── */}
      <section className="border-y border-border-subtle bg-bg-elevated/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-20 md:grid-cols-2">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {t("institutionalTitle")}
            </h2>
            <p className="leading-relaxed text-fg-muted">{t("institutionalText")}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/institucional.jpg"
            alt="Cubistas da CubingSP em campeonato"
            className="aspect-[4/3] w-full rounded-2xl border border-border-subtle object-cover shadow-xl"
            loading="lazy"
          />
        </div>
      </section>

      {/* ── Galeria da comunidade ────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="mb-8 text-3xl font-bold tracking-tight">{t("galleryTitle")}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {GALERIA.map((n) => (
            <ImageSlot
              key={n}
              src={`/images/comunidade/${n}.jpg`}
              alt="Comunidade CubingSP"
              aspect="aspect-[4/3]"
            />
          ))}
        </div>
      </section>

      {/* ── Últimas notícias ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
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
