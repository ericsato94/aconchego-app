-- Histórias criadas por IA para cada família. Criadas só pelo servidor (depois dos filtros de segurança);
-- a família lê e apaga as próprias.
create table public.custom_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('ready', 'blocked')),
  title text,
  summary text,
  paragraphs jsonb,
  mood text,
  request jsonb not null,
  block_reason text,
  reported_at timestamptz,
  report_reason text,
  created_at timestamptz not null default now(),
  constraint custom_stories_ready_has_text check (status = 'blocked' or (title is not null and paragraphs is not null))
);

create index custom_stories_user_created_idx on public.custom_stories (user_id, created_at desc);

alter table public.custom_stories enable row level security;

create policy "Ler as próprias histórias criadas" on public.custom_stories
  for select to authenticated
  using ((select auth.uid()) = user_id and status = 'ready');

create policy "Apagar as próprias histórias criadas" on public.custom_stories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.custom_stories from anon;
grant select, delete on public.custom_stories to authenticated;

-- Registro de uso (base dos limites por plano). Só o servidor grava e lê:
-- apagar uma história não "devolve" o crédito do mês.
create table public.story_generations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  story_id uuid references public.custom_stories (id) on delete set null,
  status text not null check (status in ('ready', 'blocked', 'failed')),
  created_at timestamptz not null default now()
);

create index story_generations_user_created_idx on public.story_generations (user_id, created_at desc);

alter table public.story_generations enable row level security;
revoke all on public.story_generations from anon, authenticated;
