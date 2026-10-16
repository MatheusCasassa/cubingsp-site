import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Habilita bindings da Cloudflare (KV, R2, etc.) durante `next dev`
initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Hub externo de ferramentas (mesmo valor usado no menu: src/lib/links.ts).
const TOOLS_HUB_URL =
  process.env.NEXT_PUBLIC_TOOLS_HUB_URL || "https://cubingspferramentas.mcasassa.workers.dev/";

const nextConfig: NextConfig = {
  // IMPORTANTE (arquitetura de cache):
  // Com @opennextjs/cloudflare NÃO usamos `export const runtime = 'edge'`
  // nas páginas. O app inteiro roda no runtime Node.js do workerd
  // (nativo da Cloudflare), que é o que permite ISR/PPR de verdade.
  // O adaptador antigo (@cloudflare/next-on-pages) exigia edge runtime
  // e por isso NÃO suportava ISR — foi descontinuado pela Cloudflare.

  images: {
    // O otimizador de imagens do Next não roda em Workers no plano free.
    // Servimos imagens já otimizadas (WebP/AVIF pré-gerados em /public)
    // ou via Supabase Storage com transformações. Isso também evita
    // consumir requisições dinâmicas do Worker com /_next/image.
    unoptimized: true,
  },

  // As ferramentas saíram do site e foram para o hub próprio. Links
  // antigos (/ferramentas, /en/tools, /es/herramientas e subpáginas como
  // /ferramentas/sumulas) continuam funcionando, redirecionando para o hub.
  // Redirects do next.config rodam ANTES do middleware de idioma.
  // Temporário (307) enquanto o hub estiver no domínio *.workers.dev: se
  // ele ganhar domínio próprio, os navegadores não ficam presos ao antigo.
  redirects: async () => [
    { source: "/ferramentas/:path*", destination: TOOLS_HUB_URL, permanent: false },
    { source: "/tools/:path*", destination: TOOLS_HUB_URL, permanent: false },
    { source: "/herramientas/:path*", destination: TOOLS_HUB_URL, permanent: false },
    {
      source: "/:locale(pt|en|es)/:section(ferramentas|tools|herramientas)/:path*",
      destination: TOOLS_HUB_URL,
      permanent: false,
    },
  ],

  // Cache agressivo de assets estáticos na borda (imutáveis por hash).
  headers: async () => [
    {
      source: "/images/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],

  experimental: {
    // Reduz o tamanho do bundle do Worker (limite de 3 MiB gzip no free).
    optimizePackageImports: ["@supabase/supabase-js"],
  },
};

export default withNextIntl(nextConfig);
