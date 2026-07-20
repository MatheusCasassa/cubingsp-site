"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { SocialButtons } from "./social-buttons";

/** Formulário de login/cadastro por e-mail e senha + botões sociais. */
export function AuthForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = getBrowserSupabase();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "error" | "ok"; text: string } | null>(null);

  const configured = !!supabase;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setMsg(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/perfil` },
      });
      if (error) setMsg({ type: "error", text: error.message });
      else setMsg({ type: "ok", text: t("checkEmail") });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg({ type: "error", text: error.message });
      else router.push("/perfil");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-bold tracking-tight">
        {mode === "login" ? t("loginTitle") : t("signupTitle")}
      </h1>
      <p className="mt-1 text-sm text-fg-muted">
        {mode === "login" ? t("loginSubtitle") : t("signupSubtitle")}
      </p>

      {!configured && (
        <p className="mt-6 rounded-xl border border-dashed border-border-subtle p-4 text-center text-sm text-fg-muted">
          {t("notConfigured")}
        </p>
      )}

      <div className={configured ? "mt-6" : "mt-6 pointer-events-none opacity-50"}>
        <SocialButtons />

        <div className="my-5 flex items-center gap-3 text-xs text-fg-muted">
          <span className="h-px flex-1 bg-border-subtle" />
          {t("or")}
          <span className="h-px flex-1 bg-border-subtle" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{t("email")}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-border-subtle bg-bg-elevated px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="voce@email.com"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{t("password")}</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-border-subtle bg-bg-elevated px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              placeholder="••••••••"
            />
          </label>

          {msg && (
            <p className={`text-sm ${msg.type === "error" ? "text-accent-red-soft" : "text-emerald-500"}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "…" : mode === "login" ? t("loginCta") : t("signupCta")}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-fg-muted">
          {mode === "login" ? t("noAccount") : t("hasAccount")}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMsg(null);
            }}
            className="font-semibold text-brand hover:underline"
          >
            {mode === "login" ? t("signupCta") : t("loginCta")}
          </button>
        </p>
      </div>
    </div>
  );
}
