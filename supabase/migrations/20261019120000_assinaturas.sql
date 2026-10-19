-- Assinaturas pagas (alimentadas pelo webhook da plataforma de pagamento), por e-mail do comprador.
-- O app libera voz clonada e histórias pagas para a conta com o mesmo e-mail. Só o servidor acessa.
create table public.entitlements (
  email text primary key check (email = lower(email)),
  plan text check (plan in ('mensal', 'anual')),
  status text not null check (status in ('active', 'canceled', 'revoked')),
  current_period_end timestamptz not null,
  last_event text not null,
  last_order_id text,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;
revoke all on public.entitlements from anon, authenticated;
