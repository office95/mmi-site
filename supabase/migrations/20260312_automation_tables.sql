create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  trigger text,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by text
);

create table if not exists public.automation_templates (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  locale text not null default 'de-AT',
  subject text,
  html_body text,
  text_body text,
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (automation_id, locale)
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  status text not null default 'success',
  recipient text,
  subject text,
  error_message text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_automation_logs_sent_at on public.automation_logs(sent_at desc);
