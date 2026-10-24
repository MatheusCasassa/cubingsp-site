/**
 * Links externos do site.
 *
 * As ferramentas (ScoreComps, Calcumulative, CubeStaff…) vivem num site
 * próprio — o hub de ferramentas da CubingSP —, que também tem PT/EN/ES:
 * PT na raiz, EN em /en e ES em /es. Se o hub mudar de domínio, defina
 * NEXT_PUBLIC_TOOLS_HUB_URL no Worker e faça um novo deploy.
 * (Os redirects de /ferramentas em next.config.ts seguem a mesma regra.)
 */
export const TOOLS_HUB_URL = (
  process.env.NEXT_PUBLIC_TOOLS_HUB_URL || "https://cubingspferramentas.mcasassa.workers.dev/"
).replace(/\/?$/, "/");

/** Endereço do hub no idioma do visitante. */
export function toolsHubUrl(locale: string): string {
  return locale === "en" || locale === "es" ? `${TOOLS_HUB_URL}${locale}` : TOOLS_HUB_URL;
}
