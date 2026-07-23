"use client";

/**
 * OAuth da WCA em fluxo implícito (client-side) — mesmo modelo do
 * Groupifier e do AGE. O access_token volta no fragmento da URL (#),
 * nunca passa pelo nosso servidor e fica só na sessão do navegador.
 */

const WCA_ORIGIN = "https://www.worldcubeassociation.org";
const STORAGE_KEY = "cubingsp.wca.token";

export function wcaAuthorizeUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_WCA_TOOL_CLIENT_ID;
  const redirect = `${window.location.origin}${window.location.pathname}`;
  const url = new URL(`${WCA_ORIGIN}/oauth/authorize`);
  url.searchParams.set("client_id", clientId ?? "");
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", "public manage_competitions");
  return url.toString();
}

export function isWcaToolConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_WCA_TOOL_CLIENT_ID);
}

/** Captura o token do #hash (retorno do OAuth) e limpa a URL. */
export function captureTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (hash.includes("access_token=")) {
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get("access_token");
    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token);
      history.replaceState(null, "", window.location.pathname + window.location.search);
      return token;
    }
  }
  return sessionStorage.getItem(STORAGE_KEY);
}

export function clearToken() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/* ── Cliente da API ─────────────────────────────────────────────── */

async function wcaGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${WCA_ORIGIN}/api/v0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error("unauthorized");
  }
  if (!res.ok) throw new Error(`WCA API ${res.status}`);
  return res.json();
}

export interface WcaMe {
  id: number;
  name: string;
  wca_id: string | null;
  delegate_status: string | null;
}

export async function getMe(token: string): Promise<WcaMe> {
  const data = await wcaGet<{ me: WcaMe }>(token, "/me");
  return data.me;
}

export interface WcaManagedCompetition {
  id: string;
  name: string;
  short_name: string;
  city: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
}

/**
 * Competições onde o usuário é Delegado/Organizador (managed_by_me).
 * É este filtro que garante a regra de permissão: quem não gerencia
 * nenhuma competição e não é delegado não gera súmula de nada.
 */
export async function getManagedCompetitions(
  token: string
): Promise<WcaManagedCompetition[]> {
  const comps = await wcaGet<WcaManagedCompetition[]>(
    token,
    "/competitions?managed_by_me=true&sort=-start_date&per_page=50"
  );
  // Mostra futuras e as encerradas há até 14 dias (janela útil p/ delegado)
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  return comps.filter((c) => new Date(c.end_date + "T23:59:59") >= cutoff);
}

/** WCIF completo (requer permissão de gerência na competição). */
export async function getWcif<T>(token: string, competitionId: string): Promise<T> {
  return wcaGet<T>(token, `/competitions/${competitionId}/wcif`);
}
