import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";

// Estática por enquanto — vira ISR quando os rankings forem populados.
export const dynamic = "force-static";

export const metadata: Metadata = { title: "Rankings" };

export default async function RankingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("rankings");

  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-fg-muted">{t("text")}</p>
      <p className="mt-12 rounded-2xl border border-dashed border-border-subtle p-10 text-center text-fg-muted">
        {t("comingSoon")} 🏆
      </p>
    </main>
  );
}
