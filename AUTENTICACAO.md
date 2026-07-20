# CubingSP — Ativação do Login e Perfis

O código de autenticação já está pronto no site. Enquanto as variáveis
abaixo não forem configuradas, o site funciona normalmente e o botão
"Entrar" mostra "login em breve". Ao completar este checklist, o login
passa a funcionar de verdade — sem mudar código.

## Visão geral

- **E-mail/senha** e **Google/Facebook/Apple**: nativos do Supabase Auth.
- **WCA**: não é provedor nativo. Implementado como **vínculo de conta** —
  a pessoa entra por e-mail/Google/etc. e depois vincula o WCA ID no
  perfil (`Meu Perfil → Contas vinculadas → WCA`). Isso já deixa o WCA ID
  gravado em `profiles.wca_id`, pronto para a futura integração de rankings.
  ("Entrar com WCA" como identidade principal fica para uma etapa seguinte.)

## 1. Criar o projeto Supabase e rodar as migrações

1. Crie um projeto em supabase.com (plano free).
2. SQL Editor → rode, em ordem:
   - `supabase/migrations/0001_schema_inicial.sql`
   - `supabase/migrations/0002_auth_profiles.sql`  (perfis, trigger, RLS, bucket de avatares)
3. Project Settings → API → copie a **Project URL**, a **anon key** e a
   **service_role key**.

## 2. Variáveis no Worker (Cloudflare)

No painel do Worker → Settings → Variables and Secrets:

Públicas (vars):
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
- `NEXT_PUBLIC_SITE_URL` = https://cubingsp-site.matcasviana.workers.dev (ou domínio próprio)

Secrets (encriptadas):
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key
- `REVALIDATE_SECRET` = (openssl rand -hex 32)
- `WCA_CLIENT_ID`, `WCA_CLIENT_SECRET` (passo 5)

> Importante: essas variáveis são lidas no build. Após adicioná-las,
> dispare um novo deploy (um push ou "Retry deployment") para que o
> site seja reconstruído com elas.

## 3. URLs de redirecionamento no Supabase

Authentication → URL Configuration:
- **Site URL**: a URL do site.
- **Redirect URLs**: adicione `https://SEU-SITE/auth/callback`
  (e a de qualquer domínio de preview que use).

## 4. Ativar os provedores sociais (Supabase → Authentication → Providers)

Cada um exige criar um "app" no console do provedor e colar Client ID +
Secret no Supabase. O **Redirect/Callback URL** que todos usam é o do
Supabase: `https://SEU-PROJETO.supabase.co/auth/v1/callback`.

- **Google**: console.cloud.google.com → APIs & Services → Credentials →
  OAuth client ID (Web). Cole Client ID/Secret no Supabase.
- **Facebook**: developers.facebook.com → novo app → Facebook Login →
  Client ID (App ID) + Secret.
- **Apple**: developer.apple.com (requer conta paga Apple Developer) →
  Services ID + chave. É o mais burocrático; pode ficar por último.
- **Vínculo manual (linkIdentity)**: Authentication → Providers →
  habilite **"Allow manual linking"** para que o botão "Vincular" no
  perfil funcione para Google/Facebook/Apple.

## 5. Registrar o app OAuth da WCA

1. Acesse https://www.worldcubeassociation.org/oauth/applications/new
2. **Redirect URI**: `https://SEU-SITE/api/auth/wca/callback`
3. **Scopes**: `public` e `email`.
4. Copie o **Client ID** e **Secret** → vão nos secrets do Worker
   (`WCA_CLIENT_ID`, `WCA_CLIENT_SECRET`).

## Como fica para o usuário

- Canto superior direito: **Entrar** (deslogado) → após login, vira o
  **avatar + menu** com **Meu Perfil** e **Sair**. (O item *Painel Admin*
  entra numa próxima etapa.)
- **Meu Perfil**: foto (upload no bucket `avatars`), nome, apelido,
  e-mail (somente leitura), **contas vinculadas** (Google/Facebook/Apple/WCA)
  e a **zona de exclusão de conta**.

## Notas de arquitetura

- As páginas públicas continuam **estáticas/ISR**: o menu de usuário é um
  client component que lê a sessão no browser, então não força renderização
  dinâmica nem gasta cota do Worker. Só `/perfil` e as rotas `/api/auth/*`
  são dinâmicas.
- O `middleware.ts` combina o roteamento de idioma (next-intl) com o
  refresh do cookie de sessão do Supabase.
- `profiles.wca_id` é protegido por RLS/trigger: só o fluxo OAuth WCA
  (via service_role) grava ali; o usuário não consegue forjar um WCA ID.
