-- Region columns for AT/DE content targeting
-- NULL = global/ALL

alter table public.courses add column if not exists region text check (region in ('AT','DE'));
alter table public.sessions add column if not exists region text check (region in ('AT','DE'));
alter table public.partners add column if not exists region text check (region in ('AT','DE'));

create index if not exists idx_courses_region on public.courses(region);
create index if not exists idx_sessions_region on public.sessions(region);
create index if not exists idx_partners_region on public.partners(region);
