alter table public.orders
  add column if not exists zoho_contact_id text,
  add column if not exists zoho_payment_id text,
  add column if not exists zoho_sync_status text default 'pending',
  add column if not exists zoho_sync_error text,
  add column if not exists zoho_synced_at timestamptz;

create index if not exists idx_orders_zoho_contact_id on public.orders(zoho_contact_id);
create index if not exists idx_orders_zoho_payment_id on public.orders(zoho_payment_id);
create index if not exists idx_orders_zoho_sync_status on public.orders(zoho_sync_status);
