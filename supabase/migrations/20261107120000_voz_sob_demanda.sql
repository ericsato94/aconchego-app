-- Voz sob demanda: guardamos as gravações e recriamos a voz na ElevenLabs só para narrar (sem ocupar vaga).
-- voice_id passa a ser um código do app (estável); a voz na ElevenLabs é temporária.
alter table public.voices add column if not exists recording_paths text[] not null default '{}';
alter table public.voices add column if not exists name text;
