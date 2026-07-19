import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Habilita bindings da Cloudflare (KV, R2, etc.) durante `next dev`
initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

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
