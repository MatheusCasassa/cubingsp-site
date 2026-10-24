"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { GoogleIcon, FacebookIcon, AppleIcon, WcaIcon } from "./provider-icons";

/**
 * Botões de login social. Google/Facebook/Apple são nativos do Supabase
 * (signInWithOAuth). WCA não é nativo → começa como VÍNCULO no perfil,
 * então aqui o botão WCA leva o usuário a entrar primeiro e vincular
 * depois (mostramos uma dica). `next` define para onde voltar.
 */
export function SocialButtons({ next = "/perfil" }: { next?: string }) {
  const t = useTranslations("auth");
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = getBrowserSupabase();

  async function signInWith(provider: "google" | "facebook" | "apple") {
    if (!supabase) return;
    setLoading(provider);
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }

  const base =
    "flex items-center justify-center gap-2.5 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-2.5 text-sm font-semibold transition hover:border-brand disabled:opacity-50";

  return (
    <div className="grid gap-2.5">
      <button type="button" className={base} disabled={!!loading} onClick={() => signInWith("google")}>
        <GoogleIcon /> {t("continueWith", { provider: "Google" })}
      </button>
      <button type="button" className={base} disabled={!!loading} onClick={() => signInWith("facebook")}>
        <FacebookIcon /> {t("continueWith", { provider: "Facebook" })}
      </button>
      <button type="button" className={base} disabled={!!loading} onClick={() => signInWith("apple")}>
        <AppleIcon /> {t("continueWith", { provider: "Apple" })}
      </button>
      {/* WCA: vínculo pós-login (v1). Leva ao início do fluxo, que pede
          login caso necessário e depois vincula. */}
      {/* Rota de API: navegação completa, não <Link>. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/api/auth/wca/start" className={base}>
        <WcaIcon /> {t("continueWith", { provider: "WCA" })}
      </a>
    </div>
  );
}
