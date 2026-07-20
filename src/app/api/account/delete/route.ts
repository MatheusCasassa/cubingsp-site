import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminSupabase, hasSupabaseEnv } from "@/lib/supabase/client";

/**
 * Exclusão da própria conta. Verifica a sessão, então usa service_role
 * para deletar o usuário (auth.users → profiles cai por cascade).
 */
export async function POST() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: "nao_configurado" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = supabase ? await supabase.auth.getUser() : { data: { user: null } };

  if (!user) return NextResponse.json({ error: "nao_autenticado" }, { status: 401 });

  const admin = createAdminSupabase();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
