import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getNoticiaPorSlug, getUltimasNoticias } from "@/lib/supabase/queries";

/**
 * Página de notícia individual — padrão SSG + ISR:
 *  - generateStaticParams pré-renderiza as notícias recentes no build
 *    (viram HTML estático, custo zero de Worker).
 *  - Notícias antigas são geradas on-demand na 1ª visita e cacheadas.
 *  - revalidate diário + revalidação por tag quando o conteúdo muda.
 */
export const revalidate = 86400;
export const dynamicParams = true;

export async function generateStaticParams() {
  const noticias = await getUltimasNoticias(20);
  return noticias.map((n) => ({ slug: n.slug }));
}

export default async function NoticiaPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const noticia = await getNoticiaPorSlug(slug);
  if (!noticia) notFound();

  const titulo = locale === "en" && noticia.titulo_en ? noticia.titulo_en : noticia.titulo;
  const conteudo = locale === "en" && noticia.conteudo_en ? noticia.conteudo_en : noticia.conteudo;

  return (
    <article className="prose prose-invert mx-auto max-w-3xl px-6 py-16">
      <h1>{titulo}</h1>
      {/* Renderize `conteudo` (markdown) com seu renderer preferido */}
      <div>{conteudo}</div>
    </article>
  );
}
