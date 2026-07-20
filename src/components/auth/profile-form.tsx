"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { GoogleIcon, FacebookIcon, AppleIcon, WcaIcon } from "./provider-icons";

type Props = {
  userId: string;
  email: string;
  initialNome: string;
  initialApelido: string;
  initialAvatar: string | null;
  wcaId: string | null;
  linkedProviders: string[];
};

const SOCIAL = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
  { id: "apple", label: "Apple", Icon: AppleIcon },
] as const;

export function ProfileForm(props: Props) {
  const t = useTranslations("profile");
  const router = useRouter();
  const supabase = getBrowserSupabase();

  const [nome, setNome] = useState(props.initialNome);
  const [apelido, setApelido] = useState(props.initialApelido);
  const [avatar, setAvatar] = useState<string | null>(props.initialAvatar);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ nome, apelido })
      .eq("id", props.userId);
    if (!error) {
      await supabase.auth.updateUser({ data: { full_name: nome } });
      setMsg({ type: "ok", text: t("saved") });
      router.refresh();
    } else {
      setMsg({ type: "error", text: error.message });
    }
    setSaving(false);
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !supabase) return;
    setUploading(true);
    setMsg(null);
    const ext = file.name.split(".").pop();
    const path = `${props.userId}/avatar_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (upErr) {
      setMsg({ type: "error", text: upErr.message });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = data.publicUrl;
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", props.userId);
    await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    setAvatar(publicUrl);
    setUploading(false);
    router.refresh();
  }

  async function linkSocial(provider: "google" | "facebook" | "apple") {
    if (!supabase) return;
    // Vinculação manual de identidade (requer "Manual Linking" no Supabase).
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/perfil` },
    });
    if (error) setMsg({ type: "error", text: error.message });
  }

  async function onDelete() {
    if (!supabase) return;
    if (!confirm(t("deleteConfirm"))) return;
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (res.ok) {
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } else {
      setMsg({ type: "error", text: t("deleteError") });
    }
  }

  const inicial = (nome || props.email || "?").charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-black tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-fg-muted">{t("subtitle")}</p>
      </header>

      {!supabase && (
        <p className="rounded-xl border border-dashed border-border-subtle p-4 text-sm text-fg-muted">
          {t("notConfigured")}
        </p>
      )}

      {/* Dados pessoais */}
      <form onSubmit={onSave} className="rounded-2xl border border-border-subtle bg-bg-elevated p-6">
        <h2 className="text-lg font-bold">{t("personalData")}</h2>
        <p className="mt-1 text-sm text-fg-muted">{t("personalDataHint")}</p>

        {/* Avatar */}
        <div className="mt-6 flex items-center gap-4">
          <span className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-brand text-xl font-bold text-brand-fg">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="" className="size-full object-cover" />
            ) : (
              inicial
            )}
          </span>
          <div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onAvatar} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-lg border border-border-subtle px-3 py-1.5 text-sm font-semibold transition hover:border-brand disabled:opacity-50"
            >
              {uploading ? "…" : t("changePhoto")}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{t("fullName")}</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-xl border border-border-subtle bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{t("nickname")}</span>
            <input
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder={t("nicknamePlaceholder")}
              className="rounded-xl border border-border-subtle bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="grid gap-1.5 text-sm">
            <span className="font-medium">{t("email")}</span>
            <input
              value={props.email}
              disabled
              className="rounded-xl border border-border-subtle bg-bg px-3.5 py-2.5 text-sm text-fg-muted"
            />
          </label>
        </div>

        {msg && (
          <p className={`mt-4 text-sm ${msg.type === "error" ? "text-accent-red-soft" : "text-emerald-500"}`}>
            {msg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "…" : t("save")}
        </button>
      </form>

      {/* Contas vinculadas */}
      <section className="rounded-2xl border border-border-subtle bg-bg-elevated p-6">
        <h2 className="text-lg font-bold">{t("linkedAccounts")}</h2>
        <p className="mt-1 text-sm text-fg-muted">{t("linkedAccountsHint")}</p>

        <ul className="mt-5 divide-y divide-border-subtle">
          {SOCIAL.map(({ id, label, Icon }) => {
            const linked = props.linkedProviders.includes(id);
            return (
              <li key={id} className="flex items-center justify-between py-3">
                <span className="flex items-center gap-3 text-sm font-medium">
                  <Icon /> {label}
                </span>
                {linked ? (
                  <span className="text-xs font-semibold text-emerald-500">{t("linked")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => linkSocial(id)}
                    className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold transition hover:border-brand"
                  >
                    {t("link")}
                  </button>
                )}
              </li>
            );
          })}

          {/* WCA */}
          <li className="flex items-center justify-between py-3">
            <span className="flex items-center gap-3 text-sm font-medium">
              <WcaIcon /> WCA{" "}
              {props.wcaId && <code className="font-mono text-xs text-fg-muted">{props.wcaId}</code>}
            </span>
            {props.wcaId ? (
              <span className="text-xs font-semibold text-emerald-500">{t("linked")}</span>
            ) : (
              <a
                href="/api/auth/wca/start"
                className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold transition hover:border-brand"
              >
                {t("link")}
              </a>
            )}
          </li>
        </ul>
      </section>

      {/* Zona de perigo */}
      <section className="rounded-2xl border border-accent-red/40 p-6">
        <h2 className="text-lg font-bold text-accent-red-soft">{t("deleteTitle")}</h2>
        <p className="mt-1 text-sm text-fg-muted">{t("deleteHint")}</p>
        <button
          type="button"
          onClick={onDelete}
          className="mt-4 flex items-center gap-2 rounded-xl bg-accent-red px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
          {t("deleteCta")}
        </button>
      </section>
    </div>
  );
}
