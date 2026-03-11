alter table public.sessions
  add column if not exists zoho_item_sync_status text,
  add column if not exists zoho_item_sync_error text,
  add column if not exists zoho_item_synced_at timestamptz;

create index if not exists idx_sessions_zoho_item_sync_status on public.sessions(zoho_item_sync_status);
