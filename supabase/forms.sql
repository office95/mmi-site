-- Forms schema for dynamic forms builder
-- Run in Supabase SQL Editor

-- drop helpers (optional, only for clean re-run)
-- drop table if exists public.form_answers cascade;
-- drop table if exists public.form_submissions cascade;
-- drop table if exists public.form_fields cascade;
-- drop table if exists public.forms cascade;

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  require_terms boolean default false,
  terms_url text,
  is_live boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms(id) on delete cascade,
  label text not null,
  type text not null check (type in ('text','textarea','select','radio','checkbox','multiselect')),
  options text[] default '{}', -- used for select/radio/multiselect
  required boolean default false,
  sort_order int default 0,
  placeholder text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.forms(id) on delete cascade,
  created_at timestamptz default now(),
  ip text,
  user_agent text
);

create table if not exists public.form_answers (
  submission_id uuid references public.form_submissions(id) on delete cascade,
  field_id uuid references public.form_fields(id) on delete cascade,
  value text,
  value_multi text[],
  primary key(submission_id, field_id)
);

-- RLS
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_submissions enable row level security;
alter table public.form_answers enable row level security;

-- Admin/service policies (adjust if you have auth roles)
create policy if not exists "Service full forms" on public.forms
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "Service full form_fields" on public.form_fields
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "Service full submissions" on public.form_submissions
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "Service full answers" on public.form_answers
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Public submit: allow insert submissions/answers if form is live
create policy if not exists "Public submit submissions" on public.form_submissions
  for insert with check (
    exists (select 1 from public.forms f where f.id = form_id and f.is_live = true)
  );

create policy if not exists "Public submit answers" on public.form_answers
  for insert with check (
    exists (
      select 1
      from public.form_submissions s
      join public.forms f on f.id = s.form_id
      where s.id = submission_id and f.is_live = true
    )
  );

-- Read: only service role (admin) for now
create policy if not exists "Service read forms" on public.forms for select using (auth.role() = 'service_role');
create policy if not exists "Service read fields" on public.form_fields for select using (auth.role() = 'service_role');
create policy if not exists "Service read submissions" on public.form_submissions for select using (auth.role() = 'service_role');
create policy if not exists "Service read answers" on public.form_answers for select using (auth.role() = 'service_role');

-- Trigger to auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_forms_updated on public.forms;
create trigger trg_forms_updated before update on public.forms
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_fields_updated on public.form_fields;
create trigger trg_fields_updated before update on public.form_fields
for each row execute procedure public.touch_updated_at();
