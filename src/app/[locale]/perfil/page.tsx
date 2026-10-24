import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/auth/profile-form";

// Depende da sessão (cookies) → sempre dinâmica, nunca cacheada.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Meu Perfil" };

export default async function PerfilPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createSupabaseServerClient();
  // Redirect com idioma (next-intl): /perfil → /entrar, /en/perfil → /en/entrar
  if (!supabase) return redirect({ href: "/entrar", locale });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect({ href: "/entrar", locale });

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, apelido, avatar_url, wca_id")
    .eq("id", user.id)
    .maybeSingle();

  const linkedProviders = (user.identities ?? []).map((i) => i.provider);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <ProfileForm
        userId={user.id}
        email={user.email ?? ""}
        initialNome={profile?.nome ?? user.user_metadata?.full_name ?? ""}
        initialApelido={profile?.apelido ?? ""}
        initialAvatar={profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null}
        wcaId={profile?.wca_id ?? null}
        linkedProviders={linkedProviders}
      />
    </main>
  );
}
