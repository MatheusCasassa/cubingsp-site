import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ImageSlot } from "@/components/ui/image-slot";
import { getProximasCompeticoes, getUltimasNoticias } from "@/lib/supabase/queries";

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
  const [competicoes, noticias] = await Promise.all([
    getProximasCompeticoes(),
    getUltimasNoticias(3),
  ]);

  return (
    <main>
      {/* ── Hero (texto + foto da comunidade) ────────────────────── */}
      <section className="mx-auto grid min-h-[78dvh] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <h1 className="max-w-xl text-5xl font-black leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="max-w-lg text-lg leading-relaxed text-fg-muted">
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

        {/* Foto principal da comunidade */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero.jpg"
            alt="Comunidade CubingSP reunida em competição"
            className="aspect-[16/10] w-full rounded-3xl border border-border-subtle object-cover shadow-2xl"
            fetchPriority="high"
          />
          {/* Selo da logo sobreposto */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo.png"
            alt=""
            aria-hidden
            className="absolute -bottom-5 -left-5 hidden size-24 drop-shadow-xl sm:block"
          />
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
