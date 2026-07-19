-- ═══════════════════════════════════════════════════════════════════
-- CubingSP — Migração inicial
-- Tabelas: noticias_eventos, membros, rankings_estaduais
-- Filosofia: o site lê estes dados via ISR (poucas leituras/dia).
-- RLS ligado em tudo; leitura pública só do que é publicável.
-- ═══════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────
create type tipo_conteudo as enum ('noticia', 'evento', 'comunicado');
create type status_publicacao as enum ('rascunho', 'publicado', 'arquivado');

-- ═══════════════════════════════════════════════════════════════════
-- 1. NOTÍCIAS E EVENTOS
--    Alimenta a Home, /noticias e /competicoes via ISR.
-- ═══════════════════════════════════════════════════════════════════
create table public.noticias_eventos (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  tipo            tipo_conteudo not null default 'noticia',
  status          status_publicacao not null default 'rascunho',

  titulo          text not null,
  titulo_en       text,                         -- i18n: versão em inglês (opcional)
  resumo          text,
  resumo_en       text,
  conteudo        text,                         -- markdown
  conteudo_en     text,
  imagem_capa_url text,

  -- Campos específicos de eventos/competições
  data_inicio     date,
  data_fim        date,
  cidade          text,
  local_endereco  text,
  wca_competition_id text unique,               -- ex: 'SPOpen2026' → futura integração WCA
  inscricoes_url  text,

  publicado_em    timestamptz,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

comment on table public.noticias_eventos is
  'Notícias, comunicados e competições. wca_competition_id liga à API da WCA.';

-- Índices para as queries do site (listagens ISR)
create index idx_noticias_publicadas
  on public.noticias_eventos (publicado_em desc)
  where status = 'publicado';

create index idx_eventos_futuros
  on public.noticias_eventos (data_inicio asc)
  where status = 'publicado' and tipo = 'evento';

-- ═══════════════════════════════════════════════════════════════════
-- 2. MEMBROS
--    Diretoria, delegados e staff exibidos em /sobre.
--    Dados pessoais sensíveis (email) NUNCA expostos publicamente.
-- ═══════════════════════════════════════════════════════════════════
create table public.membros (
  id              uuid primary key default gen_random_uuid(),
  wca_id          text unique,                  -- ex: '2015VIAN01' → chave p/ API WCA
  nome            text not null,
  cargo           text,                         -- 'Presidente', 'Delegado WCA', etc.
  bio             text,
  bio_en          text,
  foto_url        text,
  cidade          text,
  email           text,                         -- privado (RLS bloqueia leitura pública)
  exibir_no_site  boolean not null default false,
  ordem_exibicao  int not null default 100,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

create index idx_membros_site
  on public.membros (ordem_exibicao asc)
  where exibir_no_site = true;

-- View pública SEM colunas sensíveis — o site só consulta esta view.
create view public.membros_publicos
  with (security_invoker = true) as
  select id, wca_id, nome, cargo, bio, bio_en, foto_url, cidade, ordem_exibicao
  from public.membros
  where exibir_no_site = true;

-- ═══════════════════════════════════════════════════════════════════
-- 3. RANKINGS ESTADUAIS
--    Snapshot dos melhores resultados de SP por evento WCA.
--    Populada por um job periódico que consome a API/export da WCA —
--    o site NUNCA chama a WCA em tempo de requisição.
-- ═══════════════════════════════════════════════════════════════════
create table public.rankings_estaduais (
  id              uuid primary key default gen_random_uuid(),
  wca_event_id    text not null,                -- '333', '222', '444', 'pyram'...
  tipo_resultado  text not null check (tipo_resultado in ('single', 'average')),
  posicao         int not null,

  wca_person_id   text not null,                -- ex: '2015VIAN01'
  nome_competidor text not null,
  resultado_ms    int not null,                 -- centésimos p/ tempos; movimentos p/ FMC
  resultado_fmt   text not null,                -- já formatado: '5.47', '1:02.33'
  competicao_id   text,                         -- WCA competition id onde foi obtido
  competicao_nome text,
  data_resultado  date,

  atualizado_em   timestamptz not null default now(),

  unique (wca_event_id, tipo_resultado, posicao)
);

comment on table public.rankings_estaduais is
  'Snapshot de rankings de SP. Atualizada por job (cron), lida pelo site via ISR.';

create index idx_rankings_evento
  on public.rankings_estaduais (wca_event_id, tipo_resultado, posicao asc);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Padrão: tudo bloqueado; abrimos apenas leitura do que é público.
-- Escrita SÓ via service_role (painel admin / jobs), nunca via anon.
-- ═══════════════════════════════════════════════════════════════════
alter table public.noticias_eventos   enable row level security;
alter table public.membros            enable row level security;
alter table public.rankings_estaduais enable row level security;

create policy "leitura publica de conteudo publicado"
  on public.noticias_eventos for select
  to anon, authenticated
  using (status = 'publicado');

create policy "leitura publica de membros exibidos"
  on public.membros for select
  to anon, authenticated
  using (exibir_no_site = true);
  -- Obs: a coluna email existe na tabela, mas o site consome apenas a
  -- view membros_publicos, que não expõe email.

create policy "leitura publica de rankings"
  on public.rankings_estaduais for select
  to anon, authenticated
  using (true);

-- ═══════════════════════════════════════════════════════════════════
-- Trigger de atualizado_em
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end $$;

create trigger trg_noticias_atualizado
  before update on public.noticias_eventos
  for each row execute function public.set_atualizado_em();

create trigger trg_membros_atualizado
  before update on public.membros
  for each row execute function public.set_atualizado_em();
