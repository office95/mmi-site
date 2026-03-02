-- Add slug column to partners if missing and backfill
alter table public.partners add column if not exists slug text unique;

update public.partners
set slug = regexp_replace(
              regexp_replace(
                regexp_replace(lower(name), '[^a-z0-9äöüß\\- ]', '', 'g'),
              '\\s+', '-', 'g'),
            '-+', '-', 'g')
where slug is null;
