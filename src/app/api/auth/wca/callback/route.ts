import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { WCA } from "@/lib/auth/providers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminSupabase, hasSupabaseEnv } from "@/lib/supabase/client";

/**
 * Callback do OAuth WCA. Troca o code por token, lê o WCA ID em /me e
 * grava em profiles.wca_id do usuário logado (via service_role, pois a
 * RLS impede o próprio usuário de escrever wca_id).
 */
export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const fail = (motivo: string) =>
    NextResponse.redirect(new URL(`/perfil?wca=${motivo}`, origin));

  const cookieStore = await cookies();
  const savedState = cookieStore.get("wca_oauth_state")?.value;
  if (!code || !state || !savedState || state !== savedState) return fail("estado_invalido");

  const clientId = process.env.WCA_CLIENT_ID;
  const clientSecret = process.env.WCA_CLIENT_SECRET;
  if (!clientId || !clientSecret || !hasSupabaseEnv()) return fail("nao_configurado");

  // Precisa estar logado para vincular.
  const supabase = await createSupabaseServerClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!userData?.user) return NextResponse.redirect(new URL("/entrar?next=/perfil", origin));

  // 1) Troca o code por access_token
  const tokenRes = await fetch(WCA.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/auth/wca/callback`,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!tokenRes.ok) return fail("token");
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return fail("token");

  // 2) Lê o perfil WCA
  const meRes = await fetch(WCA.meUrl, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) return fail("perfil");
  const me = (await meRes.json()) as { me?: { wca_id?: string | null; name?: string } };
  const wcaId = me.me?.wca_id;
  if (!wcaId) return fail("sem_wca_id"); // usuário WCA sem competições ainda

  // 3) Grava wca_id via service_role
  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({ wca_id: wcaId })
    .eq("id", userData.user.id);
  if (error) {
    // provavelmente WCA ID já vinculado a outra conta (unique)
    return fail("ja_vinculado");
  }

  const res = NextResponse.redirect(new URL("/perfil?wca=ok", origin));
  res.cookies.delete("wca_oauth_state");
  return res;
}
