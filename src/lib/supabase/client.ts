import { createClient, type SupabaseClient } from "@supabase/supabase-js";
// import type { Database } from "./database.types"; // gere com `npm run db:types`

/** True quando as variáveis públicas do Supabase estão configuradas. */
export function hasSupabaseEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Cliente Supabase para o SERVIDOR (Server Components, Route Handlers).
 *
 * Regras de ouro para proteger a cota de Egress (5 GB/mês):
 *  1. Este cliente só deve ser chamado dentro de funções cacheadas
 *     (ISR / unstable_cache) — nunca a cada requisição de usuário.
 *  2. Sempre use .select() com colunas explícitas, nunca select('*').
 *  3. Sempre pagine com .range() ou .limit().
 */
export function createServerSupabase(): SupabaseClient /*<Database>*/ {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY ausentes."
    );
  }

  return createClient(url, anonKey, {
    auth: {
      // Workers são stateless: sem sessão persistida no servidor.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      // O fetch nativo do workerd participa do cache de fetch do Next.
      fetch,
    },
  });
}

/**
 * Cliente ADMIN (service_role) — apenas para Route Handlers de
 * administração e jobs (ex: sincronizar rankings da WCA).
 * NUNCA importar em Client Components.
 */
export function createAdminSupabase(): SupabaseClient /*<Database>*/ {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY ausente (secret do Worker).");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
