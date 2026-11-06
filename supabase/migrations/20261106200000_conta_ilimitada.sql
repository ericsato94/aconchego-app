-- Conta liberada manualmente (dono/testes): todos os recursos, sem limite de histórias.
-- Para liberar: insert into entitlements (email, plan, status, current_period_end, last_event)
--               values ('<email>', 'ilimitado', 'active', '2099-12-31', 'liberacao_manual');
alter table public.entitlements drop constraint if exists entitlements_plan_check;
alter table public.entitlements add constraint entitlements_plan_check check (plan in ('mensal', 'anual', 'ilimitado'));
