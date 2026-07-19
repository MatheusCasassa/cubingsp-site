import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

export default defineCloudflareConfig({
  // Cache ISR em R2 (free: 10 GB + 10 milhões de leituras Class B/mês —
  // muito mais folgado que o KV free, que dá só 100k leituras/DIA).
  //
  // withRegionalCache adiciona uma camada de Cache API (ilimitada e
  // gratuita) na frente do R2: páginas ISR quentes são servidas do
  // datacenter local sem sequer tocar o R2. Em pico de campeonato,
  // isso significa que 50k acessos à home geram ~1 leitura de R2
  // por período de revalidação, não 50k.
  incrementalCache: withRegionalCache(r2IncrementalCache, {
    mode: "long-lived",
    shouldLazilyUpdateOnCacheHit: true,
  }),

  // Revalidação ISR direta (suficiente no free tier; trocar por
  // doQueue/Durable Objects se precisar de revalidação garantida
  // sob concorrência extrema).
  queue: "direct",
});
