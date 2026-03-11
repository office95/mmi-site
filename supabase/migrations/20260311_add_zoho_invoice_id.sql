alter table public.orders
  add column if not exists zoho_invoice_id text;
create index if not exists idx_orders_zoho_invoice_id on public.orders(zoho_invoice_id);
