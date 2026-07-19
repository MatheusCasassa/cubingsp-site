import { unstable_cache } from "next/cache";
import { createServerSupabase, hasSupabaseEnv } from "./client";

/**
 * Camada de dados cacheada — a ÚNICA porta de entrada do site ao banco.
 *
 * Cada função é envolvida em unstable_cache com uma tag. O resultado
 * fica no cache incremental (R2 + Cache API regional), então:
 *
 *   50.000 visitantes na home  ─►  ~1 query ao Supabase por hora
 *
 * A revalidação acontece por tempo (revalidate) OU sob demanda quando
 * o painel/webhook chama /api/revalidate com a tag certa.
 *
 * Nota: se as variáveis do Supabase ainda não estiverem configuradas
 * (ex: primeiro deploy), as funções retornam vazio em vez de quebrar
 * o build — as páginas mostram seus estados vazios.
 */

const HORA = 3600;
const DIA = 86400;

export interface CompeticaoResumo {
  id: string;
  slug: string;
  titulo: string;
  titulo_en: string | null;
  resumo: string | null;
  imagem_capa_url: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  cidade: string | null;
  wca_competition_id: string | null;
  inscricoes_url: string | null;
}

export interface NoticiaResumo {
  id: string;
  slug: string;
  tipo: string;
  titulo: string;
  titulo_en: string | null;
  resumo: string | null;
  resumo_en: string | null;
  imagem_capa_url: string | null;
  publicado_em: string | null;
}

export interface MembroPublico {
  id: string;
  wca_id: string | null;
  nome: string;
  cargo: string | null;
  bio: string | null;
  bio_en: string | null;
  foto_url: string | null;
  cidade: string | null;
}

export const getProximasCompeticoes = unstable_cache(
  async (): Promise<CompeticaoResumo[]> => {
    if (!hasSupabaseEnv()) return [];
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("noticias_eventos")
      .select(
        "id, slug, titulo, titulo_en, resumo, imagem_capa_url, data_inicio, data_fim, cidade, wca_competition_id, inscricoes_url"
      )
      .eq("tipo", "evento")
      .eq("status", "publicado")
      .gte("data_fim", new Date().toISOString().slice(0, 10))
      .order("data_inicio", { ascending: true })
      .limit(12);

    if (error) {
      console.error("getProximasCompeticoes:", error.message);
      return [];
    }
    return data ?? [];
  },
  ["proximas-competicoes"],
  { revalidate: HORA, tags: ["competicoes"] }
);

export const getUltimasNoticias = unstable_cache(
  async (limite = 6): Promise<NoticiaResumo[]> => {
    if (!hasSupabaseEnv()) return [];
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("noticias_eventos")
      .select("id, slug, tipo, titulo, titulo_en, resumo, resumo_en, imagem_capa_url, publicado_em")
      .eq("status", "publicado")
      .order("publicado_em", { ascending: false })
      .limit(limite);

    if (error) {
      console.error("getUltimasNoticias:", error.message);
      return [];
    }
    return data ?? [];
  },
  ["ultimas-noticias"],
  { revalidate: HORA, tags: ["noticias"] }
);

export const getNoticiaPorSlug = (slug: string) =>
  unstable_cache(
    async () => {
      if (!hasSupabaseEnv()) return null;
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("noticias_eventos")
        .select("*")
        .eq("slug", slug)
        .eq("status", "publicado")
        .maybeSingle();

      if (error) {
        console.error("getNoticiaPorSlug:", error.message);
        return null;
      }
      return data;
    },
    ["noticia", slug],
    { revalidate: DIA, tags: ["noticias", `noticia:${slug}`] }
  )();

export const getMembros = unstable_cache(
  async (): Promise<MembroPublico[]> => {
    if (!hasSupabaseEnv()) return [];
    const supabase = createServerSupabase();
    // Consome a VIEW pública — nunca a tabela com colunas sensíveis.
    const { data, error } = await supabase
      .from("membros_publicos")
      .select("id, wca_id, nome, cargo, bio, bio_en, foto_url, cidade")
      .order("ordem_exibicao", { ascending: true });

    if (error) {
      console.error("getMembros:", error.message);
      return [];
    }
    return data ?? [];
  },
  ["membros"],
  { revalidate: DIA, tags: ["membros"] }
);

export const getRankingEvento = (wcaEventId: string, tipo: "single" | "average") =>
  unstable_cache(
    async () => {
      if (!hasSupabaseEnv()) return [];
      const supabase = createServerSupabase();
      const { data, error } = await supabase
        .from("rankings_estaduais")
        .select("posicao, wca_person_id, nome_competidor, resultado_fmt, competicao_nome, data_resultado")
        .eq("wca_event_id", wcaEventId)
        .eq("tipo_resultado", tipo)
        .order("posicao", { ascending: true })
        .limit(100);

      if (error) {
        console.error("getRankingEvento:", error.message);
        return [];
      }
      return data ?? [];
    },
    ["ranking", wcaEventId, tipo],
    { revalidate: 6 * HORA, tags: ["rankings", `ranking:${wcaEventId}`] }
  )();
