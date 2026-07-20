import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const hasEnv = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Middleware composto:
 *  1. next-intl resolve o locale e gera a resposta base.
 *  2. Supabase reaproveita essa resposta para refrescar o cookie da
 *     sessão (necessário porque Workers são stateless). Sem isso, o
 *     token de acesso expira e o usuário "desloga" sozinho.
 *
 * A ordem importa: criamos a resposta do intl primeiro e passamos os
 * cookies dela para o Supabase escrever, senão os Set-Cookie se perdem.
 */
export async function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  if (!hasEnv()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() dispara o refresh do token quando necessário.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Não roda em /_next, assets, arquivos, nem nos callbacks de OAuth
  // (esses precisam ler os query params crus, sem passar pelo intl).
  matcher: ["/((?!api|_next|_vercel|auth/callback|.*\\..*).*)"],
};
