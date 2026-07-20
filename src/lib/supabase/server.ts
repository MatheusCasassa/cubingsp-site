import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "./client";

/**
 * Cliente Supabase para o SERVIDOR com sessão via cookies
 * (Server Components dinâmicos e Route Handlers de auth).
 *
 * ATENÇÃO: usar `cookies()` torna a rota dinâmica — por isso este
 * cliente só é chamado nas rotas de auth/perfil, NUNCA nas páginas
 * públicas com ISR (essas continuam usando createServerSupabase de
 * ./client, sem cookies, dentro de unstable_cache).
 *
 * Retorna null se as variáveis não estiverem configuradas.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!hasSupabaseEnv()) return null;

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de um Server Component (somente leitura) — ignorado.
            // O refresh de cookie acontece no middleware.
          }
        },
      },
    }
  );
}
