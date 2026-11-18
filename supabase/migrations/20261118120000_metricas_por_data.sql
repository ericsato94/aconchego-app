-- Painel do quiz: métricas por intervalo de datas (dias no fuso de São Paulo, de p_from até p_to inclusive).
-- Mesmo cálculo de quiz_metrics(p_days), que continua existindo; esta versão aceita qualquer dia ou período.
create or replace function public.quiz_metrics_range(p_from date, p_to date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with params as (
    select
      p_from::timestamp at time zone 'America/Sao_Paulo' as since,
      (p_to + 1)::timestamp at time zone 'America/Sao_Paulo' as until
  ),
  ev as (
    select e.* from public.quiz_events e, params p where e.created_at >= p.since and e.created_at < p.until
  ),
  funnel as (
    select jsonb_build_object(
      'landing',   count(distinct session_id) filter (where type = 'landing_viewed'),
      'started',   count(distinct session_id) filter (where type = 'quiz_started'),
      'completed', count(distinct session_id) filter (where type = 'quiz_completed'),
      'leads',     count(distinct session_id) filter (where type = 'lead_submitted'),
      'results',   count(distinct session_id) filter (where type = 'result_viewed'),
      'sales',     count(distinct session_id) filter (where type = 'sales_viewed'),
      'engaged',   count(distinct session_id) filter (where type = 'offer_engaged'),
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
      where exists (select 1 from ev e where e.session_id = s.id and e.type in ('quiz_started', 'landing_viewed'))
      group by 1
    ) src
  ),
  days as (
    select generate_series(
      p_from,
      p_to,
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
    'days', (p_to - p_from) + 1,
    'from', p_from,
    'to', p_to,
    'funnel', (select data from funnel),
    'steps', (select data from steps),
    'answers', (select data from answers),
    'sources', (select data from sources),
    'daily', (select data from daily)
  );
$$;

revoke execute on function public.quiz_metrics_range(date, date) from public, anon, authenticated;
grant execute on function public.quiz_metrics_range(date, date) to service_role;
