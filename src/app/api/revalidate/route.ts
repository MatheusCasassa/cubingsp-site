import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/**
 * Revalidação sob demanda — o "botão de atualizar" do cache.
 *
 * Configure um Database Webhook no Supabase (INSERT/UPDATE em
 * noticias_eventos → POST aqui) ou chame manualmente ao publicar.
 * Assim o revalidate por tempo pode ser LONGO (menos queries) sem
 * sacrificar frescor: publicou → site atualiza em segundos.
 *
 * Exemplo:
 *   POST /api/revalidate
 *   Authorization: Bearer $REVALIDATE_SECRET
 *   { "tags": ["noticias", "competicoes"] }
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.REVALIDATE_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { tags } = (await request.json()) as { tags?: string[] };
  if (!tags?.length) {
    return NextResponse.json({ error: "tags obrigatórias" }, { status: 400 });
  }

  // Next 16: o 2º argumento é o perfil. "max" = stale-while-revalidate:
  // o próximo visitante ainda recebe a versão em cache e dispara a
  // regeneração em segundo plano (nenhum visitante espera o banco).
  for (const tag of tags) revalidateTag(tag, "max");

  return NextResponse.json({ revalidated: tags, now: Date.now() });
}
