import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Callback OAuth (Google/Facebook/Apple) e confirmação de e-mail.
 * Troca o `code` por uma sessão (grava cookies) e redireciona.
 * Fora do [locale] de propósito: precisa ler os query params crus.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/perfil";

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/entrar?erro=oauth", url.origin));
}
