# CubingSP — Arquitetura e Proteção de Cotas

## Decisão fundamental: OpenNext em Workers, não `next-on-pages`

O `@cloudflare/next-on-pages` foi **descontinuado pela Cloudflare**. Além de não receber mais atualizações, ele exigia Edge Runtime em toda página dinâmica e **não suportava ISR** — o que inviabilizaria a estratégia de cache deste projeto. O caminho oficial atual é o adaptador **`@opennextjs/cloudflare`** rodando em **Cloudflare Workers** com Static Assets, que suporta ISR, cache de fetch, revalidação por tag e o runtime Node.js do workerd.

Consequência prática importante: **não use `export const runtime = 'edge'`** em nenhuma página. O app inteiro já roda na borda da Cloudflare pelo workerd.

## Estrutura de pastas

```
cubingsp-site/
├── package.json
├── next.config.ts              # Next + next-intl + init OpenNext dev
├── open-next.config.ts         # Cache ISR: R2 + Cache API regional
├── wrangler.jsonc              # Worker, assets estáticos, bucket R2
├── postcss.config.mjs          # Tailwind v4
├── tsconfig.json
├── .env.example
│
├── supabase/
│   └── migrations/
│       └── 0001_schema_inicial.sql
│
└── src/
    ├── middleware.ts           # next-intl (matcher enxuto = menos req dinâmicas)
    │
    ├── app/
    │   ├── globals.css         # Tema Tailwind v4 (cores do cubo)
    │   ├── api/
    │   │   └── revalidate/route.ts   # Revalidação sob demanda (webhook Supabase)
    │   └── [locale]/           # pt (sem prefixo) e /en
    │       ├── layout.tsx      # generateStaticParams → SSG
    │       ├── page.tsx        # Home (ISR 1h)
    │       ├── sobre/
    │       ├── competicoes/[slug]/
    │       ├── noticias/[slug]/      # SSG + ISR on-demand
    │       ├── rankings/[eventId]/
    │       ├── ferramentas/
    │       └── formularios/[slug]/   # Formulários dinâmicos (futuro)
    │
    ├── components/
    │   ├── ui/                 # Botões, cards, primitivos
    │   ├── layout/             # Header, Footer, seletor de idioma
    │   ├── home/
    │   ├── competitions/
    │   └── rankings/
    │
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts       # createServerSupabase / createAdminSupabase
    │   │   ├── queries.ts      # ÚNICA porta ao banco — tudo via unstable_cache
    │   │   └── database.types.ts     # gerado (npm run db:types)
    │   ├── wca/
    │   │   └── api.ts          # Fetch cacheado da API da WCA
    │   └── cache/              # Helpers de tags/TTL
    │
    ├── modules/
    │   └── delegate-tools/     # Futuro: score-tools, scorecards, agrupamento
    │                           # Isolado do site — vira rota /ferramentas/*
    │
    ├── i18n/                   # routing.ts + request.ts (next-intl)
    └── messages/               # pt.json / en.json
```

Por que `src/modules/delegate-tools/` separado: as ferramentas de delegado têm ciclo de vida próprio (lógica pesada, dependências específicas, possivelmente auth WCA OAuth). Mantê-las como módulo isolado que só é importado pelas rotas de `/ferramentas` significa que o resto do site não carrega esse peso, e no futuro o módulo pode até virar um pacote/worker separado sem refatorar o site.

## As três camadas de defesa das cotas

O tráfego projetado é 10k acessos/dia com picos de 50k. Cada acesso gera ~1 requisição de documento + várias de assets. Sem cache, um pico de 50k estouraria as 100k req/dia do Worker (assets + páginas + API) e drenaria o egress do Supabase. A arquitetura resolve isso em camadas:

### Camada 1 — Static Assets (custo: zero, capacidade: infinita)

No modelo Workers + Static Assets, **requisições atendidas por assets estáticos são gratuitas e ilimitadas** — não contam nas 100k/dia. Tudo que sai do `next build` como estático (JS, CSS, imagens, fontes e **todas as páginas SSG/pré-renderizadas**, incluindo `/pt` e `/en` de cada rota gerada via `generateStaticParams`) é servido daqui.

> Meta de projeto: toda página que puder ser conhecida em build **deve** aparecer em um `generateStaticParams`. Página estática = requisição que não existe para efeito de cota.

### Camada 2 — ISR com cache regional (custo: ~zero por visitante)

Páginas com dados do banco (home, listagem de competições, rankings) usam ISR:

1. Primeira requisição do período renderiza a página (1 invocação de Worker + 1 query Supabase).
2. O HTML resultante fica no cache incremental: **R2** (persistente) com **Cache API regional** na frente (`withRegionalCache`, modo `long-lived`).
3. Até expirar o `revalidate`, todo visitante recebe o HTML do cache do próprio datacenter — a requisição ainda conta como invocação do Worker, mas **não toca Supabase nem R2**.
4. Com `shouldLazilyUpdateOnCacheHit`, a atualização acontece em background (stale-while-revalidate): nenhum usuário espera o banco.

A matemática do pico de 50k acessos num dia de campeonato:

| Recurso | Sem cache | Com esta arquitetura |
|---|---|---|
| Queries ao Supabase (home, revalidate 1h) | 50.000 | **~24/dia** |
| Egress Supabase (resposta ~20 KB) | ~1 GB/dia (estoura 5 GB/mês em 5 dias) | **~0,5 MB/dia** |
| Requisições dinâmicas do Worker | 50k × (página + API) | ~50k documentos ISR + 0 de API pública |
| Chamadas à API da WCA | 50.000 | **≤ 24/dia** (cache de fetch) |

Sobre as 100k req/dia do Worker: 50k acessos geram ~50k requisições de documento ISR (as centenas de milhares de requisições de assets são gratuitas), ficando com folga de ~50%. Se um dia o tráfego dobrar, o próximo nível é ativar Cache Rules/Tiered Cache do CDN na frente do Worker ou simplesmente alongar o `revalidate` — o custo marginal de cada visitante já é praticamente só o hit de cache.

### Camada 3 — Revalidação sob demanda (frescor sem custo)

O dilema clássico do ISR é TTL curto (dados frescos, mais queries) vs TTL longo (menos queries, dados velhos). A rota `/api/revalidate` elimina o dilema: os TTLs são **longos** (1h–24h), e quando alguém publica uma notícia ou atualiza uma competição no Supabase, um **Database Webhook** dispara `revalidateTag('noticias')` — o site atualiza em segundos. Resultado: frescor de segundos com custo de banco de ~dezenas de queries por dia.

### Regras de disciplina no código

O padrão só funciona se for respeitado em todo o código novo:

1. **Nenhum componente chama Supabase diretamente.** Toda leitura passa por `src/lib/supabase/queries.ts`, onde já nasce dentro de `unstable_cache` com tag e TTL.
2. **`select()` sempre com colunas explícitas e `limit()`** — egress é cobrado por byte trafegado.
3. **Nada de `cookies()`/`headers()`/`searchParams` em páginas públicas** — qualquer um deles torna a rota dinâmica e fura o ISR. Personalização (ex: "olá, fulano") é client-side.
4. **A API da WCA nunca é chamada no caminho do usuário** — sempre via fetch cacheado (`next.revalidate`) ou job que grava snapshot no banco (`rankings_estaduais`).
5. **Formulários dinâmicos**: a página do formulário é ISR (definição vem do banco, cacheada); só o **submit** (POST) é dinâmico — e submits são raros comparados a visualizações.
6. **Imagens**: `unoptimized: true` + assets pré-otimizados (WebP/AVIF) ou Supabase Storage com CDN — assim `/_next/image` não consome invocações do Worker.

## Cotas do free tier — mapa de risco

| Cota | Limite free | Consumo projetado (pico 50k) | Margem |
|---|---|---|---|
| Workers req/dia | 100.000 | ~50k (só documentos ISR; assets grátis) | ~2× |
| Workers CPU | 10 ms/invocação | Hit de cache ISR ≪ 10 ms | Confortável |
| R2 leituras (Class B) | 10 M/mês | Milhares/mês (Cache API absorve) | Enorme |
| R2 escritas (Class A) | 1 M/mês | ~centenas/mês (revalidações) | Enorme |
| Supabase DB | 500 MB | Schema atual: poucos MB | Anos de folga |
| Supabase Egress | 5 GB/mês | ~15–50 MB/mês | ~100× |

Ponto de atenção único: usamos **R2 (não KV)** para o cache ISR porque o KV free permite só 100k leituras/**dia** — no pico, o próprio cache estouraria a cota que ele existe para proteger. O R2 dá 10 M de leituras/**mês** e ainda fica atrás do Cache API regional.

## Passos de deploy

```bash
# 1. Instalar
npm install

# 2. Supabase: criar projeto e rodar a migração
#    (SQL Editor → colar supabase/migrations/0001_schema_inicial.sql)

# 3. Cloudflare: criar bucket do cache ISR
npx wrangler r2 bucket create cubingsp-isr-cache

# 4. Secrets
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put REVALIDATE_SECRET

# 5. Preencher vars públicas no wrangler.jsonc e .env (dev)

# 6. Testar localmente no runtime real do workerd
npm run preview

# 7. Deploy
npm run deploy
```

## Roadmap técnico

- **Fase 1 (agora)**: conteúdo institucional + competições + notícias, tudo SSG/ISR.
- **Fase 2**: rankings estaduais — job (GitHub Actions cron ou Supabase Edge Function) consome o export público da WCA e grava snapshots em `rankings_estaduais`; páginas `/rankings/[eventId]` são ISR de 6h.
- **Fase 3**: ferramentas de delegado em `src/modules/delegate-tools` — priorizar lógica client-side (geração de scorecards, agrupamento) que roda 100% no navegador: custo de servidor zero.
- **Fase 4**: formulários dinâmicos com submit via Route Handler + rate limiting, e possivelmente auth WCA OAuth para áreas restritas.
