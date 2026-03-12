-- SEO-Matrix pro logischer Seite und Domain (AT/DE)
create extension if not exists "pgcrypto";

create table if not exists public.seo_matrix (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  slug text not null,
  domain_variant text not null check (domain_variant in ('at','de')),
  locale text not null check (locale in ('de-AT','de-DE')),
  title_tag text not null,
  meta_description text,
  h1 text not null,
  hero_subline text,
  canonical_url text,
  hreflang_target_url text,
  robots_index boolean not null default true,
  robots_follow boolean not null default true,
  country_label text,
  internal_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists idx_seo_matrix_page_domain on public.seo_matrix(page_key, domain_variant);
create index if not exists idx_seo_matrix_slug on public.seo_matrix(slug);
create index if not exists idx_seo_matrix_page on public.seo_matrix(page_key);

create or replace function public.touch_updated_at_seo_matrix() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_seo_matrix_updated on public.seo_matrix;
create trigger trg_seo_matrix_updated
  before update on public.seo_matrix
  for each row
  execute function public.touch_updated_at_seo_matrix();

alter table public.seo_matrix enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seo_matrix' and policyname = 'service all seo_matrix') then
    execute 'create policy "service all seo_matrix" on public.seo_matrix for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'seo_matrix' and policyname = 'read anon seo_matrix') then
    execute 'create policy "read anon seo_matrix" on public.seo_matrix for select using (true)';
  end if;
end
$$;

comment on table public.seo_matrix is 'SEO-Lokalisierungs-Matrix pro Seite und Domain (AT/DE)';

-- Optionale Startwerte für Kernseiten (können im Admin UI überschrieben werden)
insert into public.seo_matrix (page_key, slug, domain_variant, locale, title_tag, h1, robots_index, robots_follow)
values
  ('homepage', '/', 'at', 'de-AT', 'Music Mission Institute – Kurse in Musikproduktion & Tontechnik', 'Music Mission Institute', true, true),
  ('homepage', '/', 'de', 'de-DE', 'Music Mission Institute – Kurse in Musikproduktion & Tontechnik', 'Music Mission Institute', true, true),
  ('entdecken', '/entdecken', 'at', 'de-AT', 'Kurstermine entdecken | Music Mission Institute', 'Alle Kurstermine in Österreich', true, true),
  ('entdecken', '/entdecken', 'de', 'de-DE', 'Kurstermine entdecken | Music Mission Institute', 'Alle Kurstermine in Deutschland', true, true),
  ('standorte', '/standorte', 'at', 'de-AT', 'Standorte | Music Mission Institute', 'Unsere Partner-Standorte', true, true),
  ('standorte', '/standorte', 'de', 'de-DE', 'Standorte | Music Mission Institute', 'Unsere Partner-Standorte', true, true),
  ('intensiv', '/intensiv', 'at', 'de-AT', 'Intensivausbildungen | Music Mission Institute', 'Intensivausbildungen Musikproduktion & Tontechnik', true, true),
  ('intensiv', '/intensiv', 'de', 'de-DE', 'Intensivausbildungen | Music Mission Institute', 'Intensivausbildungen Musikproduktion & Tontechnik', true, true),
  ('extremkurs', '/extremkurs', 'at', 'de-AT', 'Extremkurse | Music Mission Institute', 'Extremkurse Musikproduktion & Live-Tontechnik', true, true),
  ('extremkurs', '/extremkurs', 'de', 'de-DE', 'Extremkurse | Music Mission Institute', 'Extremkurse Musikproduktion & Live-Tontechnik', true, true),
  ('blog', '/blog', 'at', 'de-AT', 'Blog | Music Mission Institute', 'Blog: Musikproduktion, Tontechnik, DJing & Live-Sound', true, true),
  ('blog', '/blog', 'de', 'de-DE', 'Blog | Music Mission Institute', 'Blog: Musikproduktion, Tontechnik, DJing & Live-Sound', true, true),
  ('partner-werden', '/partner-werden', 'at', 'de-AT', 'Partner werden | Music Mission Institute', 'Partner werden', true, true),
  ('partner-werden', '/partner-werden', 'de', 'de-DE', 'Partner werden | Music Mission Institute', 'Partner werden', true, true),
  ('ueber-uns', '/ueber-uns', 'at', 'de-AT', 'Über uns | Music Mission Institute', 'Über uns', true, true),
  ('ueber-uns', '/ueber-uns', 'de', 'de-DE', 'Über uns | Music Mission Institute', 'Über uns', true, true),
  ('kursstandorte', '/kursstandorte', 'at', 'de-AT', 'Kursstandorte | Music Mission Institute', 'Kursstandorte', true, true),
  ('kursstandorte', '/kursstandorte', 'de', 'de-DE', 'Kursstandorte | Music Mission Institute', 'Kursstandorte', true, true),
  ('professional-audio-diploma', '/professional-audio-diploma', 'at', 'de-AT', 'Professional Audio Diploma | Music Mission Institute', 'Professional Audio Diploma', true, true),
  ('professional-audio-diploma', '/professional-audio-diploma', 'de', 'de-DE', 'Professional Audio Diploma | Music Mission Institute', 'Professional Audio Diploma', true, true)
on conflict (page_key, domain_variant) do nothing;
