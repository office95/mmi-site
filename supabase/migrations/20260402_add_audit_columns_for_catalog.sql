alter table public.partners add column if not exists created_by text;
alter table public.partners add column if not exists updated_by text;

alter table public.courses add column if not exists created_by text;
alter table public.courses add column if not exists updated_by text;

alter table public.sessions add column if not exists created_by text;
alter table public.sessions add column if not exists updated_by text;

update public.partners
set created_by = coalesce(created_by, 'system'),
    updated_by = coalesce(updated_by, created_by, 'system')
where created_by is null or updated_by is null;

update public.courses
set created_by = coalesce(created_by, 'system'),
    updated_by = coalesce(updated_by, created_by, 'system')
where created_by is null or updated_by is null;

update public.sessions
set created_by = coalesce(created_by, 'system'),
    updated_by = coalesce(updated_by, created_by, 'system')
where created_by is null or updated_by is null;

