alter table public.sessions
  add column if not exists zoho_item_id text;
create index if not exists idx_sessions_zoho_item_id on public.sessions(zoho_item_id);
