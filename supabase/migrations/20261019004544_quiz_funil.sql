-- Quiz de vendas: sessões (origem do tráfego), eventos do funil, cadastros e métricas.
-- Tudo é gravado e lido só pelo servidor (chave de serviço); o app/navegador não tem acesso.

create table public.quiz_sessions (
  id uuid primary key,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  landing_path text,
  device text check (device in ('mobile', 'tablet', 'desktop')),
  created_at timestamptz not null default now()
);

create index quiz_sessions_created_at_idx on public.quiz_sessions (created_at);

create table public.quiz_events (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.quiz_sessions (id) on delete cascade,
  type text not null check (type in (
    'quiz_started', 'question_answered', 'quiz_completed', 'lead_submitted',
    'result_viewed', 'sales_viewed', 'checkout_started', 'purchase'
  )),
  step smallint,
  question_id text,
  answer text,
  plan text,
  value numeric(10, 2),
  created_at timestamptz not null default now()
);

create index quiz_events_session_id_idx on public.quiz_events (session_id);
create index quiz_events_type_created_at_idx on public.quiz_events (type, created_at);

create table public.quiz_leads (
  session_id uuid primary key references public.quiz_sessions (id) on delete cascade,
  name text not null,
  email text,
  whatsapp text,
  contact_consent boolean not null default false,
  answers jsonb not null,
  identity text,
  created_at timestamptz not null default now(),
  constraint quiz_leads_contact check (email is not null or whatsapp is not null)
);

create index quiz_leads_created_at_idx on public.quiz_leads (created_at);
create index quiz_leads_email_idx on public.quiz_leads (lower(email));

alter table public.quiz_sessions enable row level security;
alter table public.quiz_events enable row level security;
alter table public.quiz_leads enable row level security;

revoke all on public.quiz_sessions, public.quiz_events, public.quiz_leads from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Métricas do painel (período em dias). Contagens por pessoa (sessão), não por clique.
-- ---------------------------------------------------------------------------
create or replace function public.quiz_metrics(p_days integer)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      (date_trunc('day', now() at time zone 'America/Sao_Paulo') - make_interval(days => greatest(p_days, 1) - 1))
        at time zone 'America/Sao_Paulo' as since
  ),
  ev as (
    select e.* from public.quiz_events e, params p where e.created_at >= p.since
  ),
  funnel as (
    select jsonb_build_object(
      'started',   count(distinct session_id) filter (where type = 'quiz_started'),
      'completed', count(distinct session_id) filter (where type = 'quiz_completed'),
      'leads',     count(distinct session_id) filter (where type = 'lead_submitted'),
      'results',   count(distinct session_id) filter (where type = 'result_viewed'),
      'sales',     count(distinct session_id) filter (where type = 'sales_viewed'),
      'checkout',  count(distinct session_id) filter (where type = 'checkout_started'),
      'purchases', count(distinct session_id) filter (where type = 'purchase'),
      'revenue',   coalesce(sum(value) filter (where type = 'purchase'), 0)
    ) as data from ev
  ),
  steps as (
    select coalesce(jsonb_agg(jsonb_build_object('step', step, 'questionId', question_id, 'sessions', sessions) order by step), '[]'::jsonb) as data
    from (
      select step, question_id, count(distinct session_id) as sessions
      from ev where type = 'question_answered' and step is not null
      group by step, question_id
    ) s
  ),
  last_answers as (
    -- Última resposta de cada pessoa em cada pergunta (quem voltou e trocou conta uma vez).
    select distinct on (session_id, question_id) question_id, answer
    from ev where type = 'question_answered'
    order by session_id, question_id, created_at desc
  ),
  answers as (
    select coalesce(jsonb_agg(jsonb_build_object('questionId', question_id, 'answer', answer, 'sessions', total)), '[]'::jsonb) as data
    from (select question_id, answer, count(*) as total from last_answers group by question_id, answer) a
  ),
  sources as (
    select coalesce(jsonb_agg(jsonb_build_object('source', source, 'sessions', sessions, 'leads', leads, 'purchases', purchases) order by sessions desc), '[]'::jsonb) as data
    from (
      select
        coalesce(nullif(s.utm_source, ''), nullif(split_part(regexp_replace(s.referrer, '^https?://(www\.)?', ''), '/', 1), ''), 'direto') as source,
        count(distinct s.id) as sessions,
        count(distinct s.id) filter (where exists (select 1 from ev e where e.session_id = s.id and e.type = 'lead_submitted')) as leads,
        count(distinct s.id) filter (where exists (select 1 from ev e where e.session_id = s.id and e.type = 'purchase')) as purchases
      from public.quiz_sessions s
      where exists (select 1 from ev e where e.session_id = s.id and e.type = 'quiz_started')
      group by 1
    ) src
  ),
  days as (
    select generate_series(
      (select (since at time zone 'America/Sao_Paulo')::date from params),
      (now() at time zone 'America/Sao_Paulo')::date,
      interval '1 day'
    )::date as day
  ),
  daily as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'day', d.day,
      'started',   coalesce(c.started, 0),
      'completed', coalesce(c.completed, 0),
      'leads',     coalesce(c.leads, 0),
      'checkout',  coalesce(c.checkout, 0),
      'purchases', coalesce(c.purchases, 0)
    ) order by d.day), '[]'::jsonb) as data
    from days d
    left join (
      select
        (created_at at time zone 'America/Sao_Paulo')::date as day,
        count(distinct session_id) filter (where type = 'quiz_started') as started,
        count(distinct session_id) filter (where type = 'quiz_completed') as completed,
        count(distinct session_id) filter (where type = 'lead_submitted') as leads,
        count(distinct session_id) filter (where type = 'checkout_started') as checkout,
        count(distinct session_id) filter (where type = 'purchase') as purchases
      from ev group by 1
    ) c on c.day = d.day
  )
  select jsonb_build_object(
    'days', greatest(p_days, 1),
    'funnel', (select data from funnel),
    'steps', (select data from steps),
    'answers', (select data from answers),
    'sources', (select data from sources),
    'daily', (select data from daily)
  );
$$;

revoke execute on function public.quiz_metrics(integer) from public, anon, authenticated;
grant execute on function public.quiz_metrics(integer) to service_role;
