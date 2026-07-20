-- ═══════════════════════════════════════════════════════════════════
-- CubingSP — Autenticação e perfis
-- A tabela auth.users é gerenciada pelo Supabase Auth. Aqui criamos o
-- perfil público (nome, apelido, foto, WCA id) ligado 1:1 a ela, mais
-- o bucket de avatares. Login: e-mail/senha + Google/Facebook/Apple
-- (nativos) e vínculo com a WCA (OAuth customizado → grava wca_id).
-- ═══════════════════════════════════════════════════════════════════

-- ── Tabela de perfis ────────────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  nome          text,
  apelido       text,                        -- nickname exibido
  avatar_url    text,
  wca_id        text unique,                 -- ligado ao vincular conta WCA
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil público do usuário. 1:1 com auth.users. wca_id ← vínculo OAuth WCA.';

create index idx_profiles_wca on public.profiles (wca_id) where wca_id is not null;

-- ── Criação automática do perfil ao cadastrar ──────────────────────
-- Puxa nome/avatar dos metadados do provedor (Google, etc.) quando houver.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nome, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name',
             new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── atualizado_em ──────────────────────────────────────────────────
create trigger trg_profiles_atualizado
  before update on public.profiles
  for each row execute function public.set_atualizado_em();

-- ═══════════════════════════════════════════════════════════════════
-- RLS
--  • Leitura pública dos perfis (sem dados sensíveis — e-mail fica em
--    auth.users, nunca aqui). Útil para exibir nomes em rankings.
--  • Cada usuário só edita o PRÓPRIO perfil.
--  • wca_id não pode ser alterado pelo usuário via update direto
--    (só o fluxo OAuth WCA, via service_role, grava ali).
-- ═══════════════════════════════════════════════════════════════════
alter table public.profiles enable row level security;

create policy "perfis sao publicos para leitura"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "usuario edita o proprio perfil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Protege wca_id de ser sobrescrito por update do próprio usuário:
-- só permite manter o valor atual (o vínculo WCA usa service_role).
create or replace function public.protect_wca_id()
returns trigger language plpgsql as $$
begin
  if auth.role() = 'authenticated' and new.wca_id is distinct from old.wca_id then
    new.wca_id := old.wca_id;
  end if;
  return new;
end $$;

create trigger trg_protect_wca_id
  before update on public.profiles
  for each row execute function public.protect_wca_id();

-- ═══════════════════════════════════════════════════════════════════
-- Storage: bucket de avatares
--  • Leitura pública (fotos aparecem no site).
--  • Upload/edição só na "pasta" do próprio usuário: avatars/<uid>/...
-- ═══════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatares sao publicos"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "usuario envia proprio avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuario atualiza proprio avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "usuario remove proprio avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
