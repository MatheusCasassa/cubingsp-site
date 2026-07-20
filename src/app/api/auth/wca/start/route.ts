import { NextResponse } from "next/server";
import { WCA } from "@/lib/auth/providers";

/**
 * Início do fluxo OAuth da WCA (vínculo de conta).
 * Gera `state` anti-CSRF em cookie e redireciona para a autorização WCA.
 */
export async function GET(request: Request) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const clientId = process.env.WCA_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(new URL("/perfil?wca=nao_configurado", origin));
  }

  const redirectUri = `${origin}/api/auth/wca/callback`;
  const state = crypto.randomUUID();

  const authorize = new URL(WCA.authorizeUrl);
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", WCA.scope);
  authorize.searchParams.set("state", state);

  const res = NextResponse.redirect(authorize);
  res.cookies.set("wca_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
