import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getProximasCompeticoes } from "@/lib/supabase/queries";

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
  const competicoes = await getProximasCompeticoes();

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-fg-muted">{t("subtitle")}</p>

      {competicoes.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-border-subtle p-10 text-center text-fg-muted">
          {t("empty")}
        </p>
      ) : (
        <ul className="mt-12 space-y-4">
          {competicoes.map((c) => (
            <li key={c.id}>
              <article className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-bg-elevated p-6 transition hover:border-brand md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {locale === "en" && c.titulo_en ? c.titulo_en : c.titulo}
                  </h2>
                  <p className="mt-1 font-mono text-sm text-fg-muted">
                    {c.cidade} · {c.data_inicio}
                    {c.data_fim && c.data_fim !== c.data_inicio ? ` → ${c.data_fim}` : ""}
                  </p>
                </div>
                {c.inscricoes_url && (
                  <a
                    href={c.inscricoes_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-xl bg-brand px-4 py-2.5 text-center text-sm font-semibold text-brand-fg transition hover:opacity-90"
                  >
                    {t("register")}
                  </a>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
