"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import type { User } from "@supabase/supabase-js";

/**
 * Canto superior direito: "Entrar" quando deslogado; avatar + dropdown
 * (Meu Perfil / Sair) quando logado. Client component — assim as páginas
 * públicas continuam estáticas/ISR e só hidratam o estado do usuário.
 * (O item "Painel Admin" entra numa etapa futura.)
 */
export function UserMenu() {
  const t = useTranslations("auth");
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  // Placeholder estável durante hidratação (evita "pulo" de layout)
  if (!ready) return <span className="size-9 rounded-full border border-border-subtle" aria-hidden />;

  if (!user) {
    return (
      <Link
        href="/entrar"
        className="whitespace-nowrap rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-brand-fg transition hover:opacity-90"
      >
        {t("login")}
      </Link>
    );
  }

  const meta = user.user_metadata ?? {};
  const nome = meta.full_name || meta.name || user.email?.split("@")[0] || "";
  const avatar = meta.avatar_url as string | undefined;
  const inicial = (nome || "?").charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border-subtle py-1 pl-1 pr-2.5 transition hover:border-brand"
      >
        <span className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-brand text-xs font-bold text-brand-fg">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            inicial
          )}
        </span>
        <span className="hidden max-w-[9rem] truncate text-sm font-medium sm:block">{nome}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`text-fg-muted transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-bg-elevated py-1 shadow-lg">
          <div className="border-b border-border-subtle px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{nome}</p>
            <p className="truncate text-xs text-fg-muted">{user.email}</p>
          </div>
          <Link
            href="/perfil"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-fg-muted transition hover:bg-bg hover:text-fg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21v-1a7 7 0 0 1 14 0v1" />
            </svg>
            {t("myProfile")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2.5 border-t border-border-subtle px-3 py-2.5 text-sm text-accent-red-soft transition hover:bg-bg"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            {t("logout")}
          </button>
        </div>
      )}
    </div>
  );
}
