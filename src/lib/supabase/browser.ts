"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabaseEnv } from "./client";

/**
 * Cliente Supabase para o BROWSER (Client Components).
 * Usado pelo menu de usuário, página de login e formulário de perfil.
 *
 * Retorna null quando as variáveis ainda não estão configuradas
 * (modo "pronto para ativar") — os componentes tratam esse caso
 * mostrando um estado de "login em breve".
 */
let singleton: SupabaseClient | null | undefined;

export function getBrowserSupabase(): SupabaseClient | null {
  if (singleton !== undefined) return singleton;

  if (!hasSupabaseEnv()) {
    singleton = null;
    return null;
  }

  singleton = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return singleton;
}
