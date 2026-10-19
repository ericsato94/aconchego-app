-- Código do pedido na plataforma de pagamento: evita contar a mesma compra duas vezes (reenvios do webhook).
alter table public.quiz_events add column external_id text;
create unique index quiz_events_external_id_key on public.quiz_events (external_id) where external_id is not null;
-- Busca do cadastro pelo WhatsApp (últimos dígitos) para ligar a compra ao quiz.
create index quiz_leads_whatsapp_idx on public.quiz_leads (whatsapp);
