# Aconchego — Histórias com a sua voz (V1 local)

PWA que transforma a voz do responsável em narradora de histórias infantis.
Construída a partir de `01. Identidade Visual`, `02. Funcionalidades` e `03. Telas`.

## Executar

```bash
npm install
cp .env.example .env   # preencha as chaves (Supabase e ElevenLabs)
npm run dev            # app + funções de api/ em http://localhost:5173
```

Sem a chave da ElevenLabs (ou para e-mails fora de `VOICE_ALLOWED_EMAILS`), o app usa a narração
padrão do aparelho. O modelo de voz é escolhido em `ELEVENLABS_MODEL_ID` (em uso: `eleven_v4`).

Outros scripts: `npm run build` (typecheck + build), `npm run lint`.

**Conta de demonstração:** em *Entrar*, use “Entrar com conta de demonstração”. Ela já vem com a
Sofia cadastrada e histórico (voz simulada).

## Produção

- **Vercel**: hospeda o app (PWA) e as funções de `api/`. Cada push na branch `main` publica uma nova versão.
- **Supabase**: contas (Auth), dados (Postgres com RLS) e arquivos (Storage). Esquema em `supabase/migrations/`.
- **ElevenLabs**: clonagem de voz e narração, chamada só pelo servidor.

## Stack

React 19 + TypeScript + Vite · React Router · vite-plugin-pwa (Workbox) ·
CSS com design tokens (`src/styles/tokens.css`) · fontes Baloo 2 e Inter via Fontsource (offline).

## Estrutura

```
api/                 funções do servidor (Vercel) — também rodam no `npm run dev`
  health.ts            situação do serviço de voz
  voices/index.ts      criar voz clonada (só e-mails autorizados)
  voices/[id].ts       excluir voz + gravações + narrações (LGPD)
  narration.ts         narração da história inteira, com cache no Supabase
  _lib/                ElevenLabs, Supabase (chave de serviço) e utilidades HTTP
supabase/migrations/ tabelas user_data, consents (imutável), voices, narrations + buckets
src/
  config/      nome do app, regras do plano, parâmetros, breakpoints
  data/        catálogo de histórias e roteiro de gravação
  services/    Supabase, auth, dados do usuário, gravações, narração, PWA
  store/       estado global: sessão/dados, player, toasts
  layout/      shell (sidebar, bottom nav, mini player, overlay do modo dormir)
  components/  componentes reutilizáveis
  pages/       telas por área
```

## Segurança

- Chaves só no servidor (`.env` local e variáveis de ambiente da Vercel); o app usa apenas a chave pública do Supabase.
- RLS em todas as tabelas: cada conta só lê e altera os próprios dados. O registro de consentimento não pode ser alterado.
- Gravações em bucket privado (`recordings/<user_id>/`); narrações acessadas por link temporário.
- O servidor confere o dono da voz antes de narrar ou excluir.

## Ainda não implementado

| Recurso | Situação |
|---|---|
| Login com Google | Botão pronto; ativar o provedor Google no Supabase |
| Assinatura | Troca de plano sem cobrança (cobrança das lojas na próxima fase) |
| Notificações | No app e pela Notification API com o app aberto (push real depende de Firebase/APNs) |
