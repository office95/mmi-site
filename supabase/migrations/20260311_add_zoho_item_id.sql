alter table public.courses
  add column if not exists zoho_item_id text;
create index if not exists idx_courses_zoho_item_id on public.courses(zoho_item_id);
