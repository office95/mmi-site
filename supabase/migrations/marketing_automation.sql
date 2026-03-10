-- Marketing Automation schema (MVP)
-- Tables are RLS-enabled; service_role hat Vollzugriff.

create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  partner_id uuid references public.partners(id) on delete set null,
  status text not null default 'generated', -- Status laut App-Logik
  template text,
  platforms jsonb default '[]'::jsonb,
  scheduled_at timestamptz,
  approved_at timestamptz,
  approved_by text,
  content jsonb default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_runs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  ok boolean default true,
  summary jsonb,
  note text
);

alter table public.marketing_campaigns enable row level security;
alter table public.marketing_runs enable row level security;

create policy marketing_campaigns_service_role on public.marketing_campaigns
  for all using (true) with check (true);

create policy marketing_runs_service_role on public.marketing_runs
  for all using (true) with check (true);

