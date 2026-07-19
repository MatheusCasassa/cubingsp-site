import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getMembros } from "@/lib/supabase/queries";

export const revalidate = 86400; // conteúdo institucional muda pouco

export const metadata: Metadata = { title: "Sobre" };

export default async function SobrePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const membros = await getMembros();

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{t("title")}</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-muted">{t("intro")}</p>

      <section className="mt-16 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">{t("historyTitle")}</h2>
        <p className="leading-relaxed text-fg-muted">{t("historyText")}</p>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight">{t("missionTitle")}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {(["mission1", "mission2", "mission3", "mission4"] as const).map((key) => (
            <li
              key={key}
              className="rounded-2xl border border-border-subtle bg-bg-elevated p-5 text-sm leading-relaxed text-fg-muted"
            >
              {t(key)}
            </li>
          ))}
        </ul>
      </section>

      {membros.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight">{t("teamTitle")}</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {membros.map((m) => (
              <li
                key={m.id}
                className="rounded-2xl border border-border-subtle bg-bg-elevated p-5"
              >
                <h3 className="font-semibold">{m.nome}</h3>
                <p className="text-sm text-fg-muted">{m.cargo}</p>
                {m.wca_id && (
                  <p className="mt-1 font-mono text-xs text-fg-muted">{m.wca_id}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
