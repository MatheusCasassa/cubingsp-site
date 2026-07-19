import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Matcher enxuto: NÃO roda em /_next, /api, assets ou arquivos.
  // Cada execução de middleware em rota dinâmica conta na cota do
  // Worker — quanto menos ele rodar, melhor.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
