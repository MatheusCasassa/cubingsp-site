/**
 * Links externos do site.
 *
 * As ferramentas (ScoreComps, Calcumulative, CubeStaff…) vivem num site
 * próprio — o hub de ferramentas da CubingSP. Se o hub mudar de domínio,
 * defina NEXT_PUBLIC_TOOLS_HUB_URL no Worker e faça um novo deploy.
 * (Os redirects de /ferramentas em next.config.ts usam o mesmo valor.)
 */
export const TOOLS_HUB_URL =
  process.env.NEXT_PUBLIC_TOOLS_HUB_URL || "https://cubingspferramentas.mcasassa.workers.dev/";
