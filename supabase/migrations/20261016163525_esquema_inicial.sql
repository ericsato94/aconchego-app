-- Aconchego — esquema inicial
-- Contas: Supabase Auth (auth.users). Cada família só acessa os próprios dados (RLS).

-- ---------------------------------------------------------------------------
-- Dados do app por conta: crianças, progresso, favoritos, preferências, notificações.
-- Um documento JSON por usuário, gravado pelo próprio app.
-- ---------------------------------------------------------------------------
create table public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

create policy "Ler os próprios dados" on public.user_data
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Criar os próprios dados" on public.user_data
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Atualizar os próprios dados" on public.user_data
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.user_data from anon;
grant select, insert, update on public.user_data to authenticated;

-- ---------------------------------------------------------------------------
-- Consentimento LGPD: registro de aceite (prova legal). Só inserção e leitura —
-- sem políticas de UPDATE/DELETE, então não pode ser alterado pelo app.
-- ---------------------------------------------------------------------------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  version text not null,
  items text[] not null,
  user_agent text,
  accepted_at timestamptz not null default now()
);

create index consents_user_id_idx on public.consents (user_id);

alter table public.consents enable row level security;

create policy "Ler os próprios aceites" on public.consents
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Registrar o próprio aceite" on public.consents
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on public.consents from anon;
grant select, insert on public.consents to authenticated;

-- ---------------------------------------------------------------------------
-- Vozes clonadas na ElevenLabs. Escritas só pelo servidor (service role), que
-- confere o dono antes de narrar ou excluir.
-- ---------------------------------------------------------------------------
create table public.voices (
  voice_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  model text,
  created_at timestamptz not null default now()
);

create index voices_user_id_idx on public.voices (user_id);

alter table public.voices enable row level security;

create policy "Ver as próprias vozes" on public.voices
  for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.voices from anon;
grant select on public.voices to authenticated;

-- ---------------------------------------------------------------------------
-- Cache das narrações geradas (cada história é cobrada uma vez por voz/velocidade).
-- Só o servidor acessa (sem políticas para o app).
-- ---------------------------------------------------------------------------
create table public.narrations (
  key text primary key,
  voice_id text not null references public.voices (voice_id) on delete cascade,
  storage_path text not null,
  duration real not null,
  starts jsonb not null,
  created_at timestamptz not null default now()
);

create index narrations_voice_id_idx on public.narrations (voice_id);

alter table public.narrations enable row level security;

revoke all on public.narrations from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Armazenamento (privado)
--   recordings/<user_id>/…  gravações da voz, enviadas pelo próprio usuário
--   narrations/<voice_id>/… áudios gerados, gravados e lidos só pelo servidor
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('recordings', 'recordings', false, 26214400, array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-m4a']),
  ('narrations', 'narrations', false, 52428800, array['audio/mpeg'])
on conflict (id) do nothing;

create policy "Enviar as próprias gravações" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Ler as próprias gravações" on storage.objects
  for select to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Substituir as próprias gravações" on storage.objects
  for update to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Apagar as próprias gravações" on storage.objects
  for delete to authenticated
  using (bucket_id = 'recordings' and (storage.foldername(name))[1] = (select auth.uid())::text);
