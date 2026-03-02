-- Music Mission Institute - Initial Schema
-- Run this in Supabase SQL Editor

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  city text,
  country text default 'DE',
  short_description text,
  description text,
  website text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.partners(id) on delete set null,
  name text not null,
  role text,
  bio text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text,
  level text,
  category_id uuid references public.course_categories(id) on delete set null,
  subcategory_id uuid references public.course_categories(id) on delete set null,
  format_id uuid references public.course_formats(id) on delete set null,
  level_id uuid references public.course_levels(id) on delete set null,
  language_id uuid references public.course_languages(id) on delete set null,
  hero_image_url text,
  summary text,
  description text,
  base_price_cents int not null,
  deposit_cents int,
  max_participants int,
  duration_hours int,
  language text default 'de',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete set null,
  start_date date not null,
  start_time time,
  end_time time,
  city text,
  address text,
  price_cents int,
  deposit_cents int,
  max_participants int,
  seats_taken int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.tags (
  id serial primary key,
  name text unique not null
);

create table public.course_tags (
  course_id uuid references public.courses(id) on delete cascade,
  tag_id int references public.tags(id) on delete cascade,
  primary key(course_id, tag_id)
);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  name text not null,
  description text,
  price_cents int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  email text not null,
  first_name text,
  last_name text,
  amount_cents int not null,
  deposit_cents int,
  currency text default 'EUR',
  stripe_payment_intent text,
  status text default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.order_addons (
  order_id uuid references public.orders(id) on delete cascade,
  addon_id uuid references public.addons(id) on delete set null,
  price_cents int not null,
  primary key(order_id, addon_id)
);

-- Course taxonomies
create table public.course_formats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.course_levels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.course_languages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.course_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  parent_id uuid references public.course_categories(id) on delete cascade,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Basic RLS setup
alter table public.partners enable row level security;
alter table public.instructors enable row level security;
alter table public.courses enable row level security;
alter table public.sessions enable row level security;
alter table public.tags enable row level security;
alter table public.course_tags enable row level security;
alter table public.addons enable row level security;
alter table public.orders enable row level security;
alter table public.order_addons enable row level security;
alter table public.course_formats enable row level security;
alter table public.course_categories enable row level security;
alter table public.course_levels enable row level security;
alter table public.course_languages enable row level security;
alter table public.course_types enable row level security;

-- Public read policies for brochure data
create policy "Public read partners" on public.partners for select using (true);
create policy "Public read instructors" on public.instructors for select using (true);
create policy "Public read courses" on public.courses for select using (true);
create policy "Public read sessions" on public.sessions for select using (true);
create policy "Public read tags" on public.tags for select using (true);
create policy "Public read course_tags" on public.course_tags for select using (true);
create policy "Public read addons" on public.addons for select using (true);
create policy "Public read course_formats" on public.course_formats for select using (true);
create policy "Public read course_categories" on public.course_categories for select using (true);
create policy "Public read course_levels" on public.course_levels for select using (true);
create policy "Public read course_languages" on public.course_languages for select using (true);
create policy "Public read course_types" on public.course_types for select using (true);

-- Admin (Service Role) insert/update/delete
create policy if not exists "Service write course_formats" on public.course_formats for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "Service write course_categories" on public.course_categories for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "Service write course_levels" on public.course_levels for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "Service write course_languages" on public.course_languages for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy if not exists "Service write course_types" on public.course_types for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Orders should only be inserted via service role / backend
create policy "Service inserts orders" on public.orders for insert
  with check (auth.role() = 'service_role');
create policy "Service inserts order_addons" on public.order_addons for insert
  with check (auth.role() = 'service_role');

-- Updates for seat counts via service role only
create policy "Service updates sessions" on public.sessions for update
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Optionally allow anon to read order confirmation of their own PI (later)

-- Helper views can be added later for denormalized course listings

-- ----------------------------
-- Public mirror tables (readonly for frontend, fed by CRM sync)
-- ----------------------------

create table if not exists public.partners_public (
  id uuid primary key,
  slug text unique not null,
  name text not null,
  city text,
  state text,
  zip text,
  country text default 'DE',
  short_description text,
  website_description text,
  website_slogan text,
  hero_image_url text,
  logo_path text,
  hero1_path text,
  hero2_path text,
  gallery_paths text[] default '{}',
  teacher_profiles jsonb,
  teacher_image text,
  teacher_name text,
  teacher_description text,
  website_tags text[] default '{}',
  tags text[] default '{}',
  email text,
  status text,
  is_active boolean default true,
  updated_at timestamptz default now()
);

create table if not exists public.partner_overrides (
  partner_id uuid primary key references public.partners_public(id) on delete cascade,
  hero_title text,
  hero_subtitle text,
  cta_label text,
  cta_url text,
  updated_at timestamptz default now()
);

alter table public.partners_public enable row level security;
alter table public.partner_overrides enable row level security;

create policy "Public read partners_public" on public.partners_public for select using (true);
create policy "Public read partner_overrides" on public.partner_overrides for select using (true);

-- service role can upsert sync data
create policy "Service upsert partners_public" on public.partners_public for
  insert with check (auth.role() = 'service_role');
create policy "Service upsert partners_public update" on public.partners_public for
  update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create policy "Service upsert partner_overrides" on public.partner_overrides for
  insert with check (auth.role() = 'service_role');
create policy "Service upsert partner_overrides update" on public.partner_overrides for
  update using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ----------------------------
-- Hero Slides (Startseite)
-- ----------------------------
create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text,
  subtitle text,
  image_url text not null,
  position int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.hero_slides enable row level security;
create policy "Public read hero" on public.hero_slides for select using (true);
create policy "Service write hero" on public.hero_slides for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ----------------------------
-- Media Files (Metadaten)
-- ----------------------------
create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  path text unique not null,
  url text not null,
  title text,
  alt text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

alter table public.media_files enable row level security;
create policy "Public read media_files" on public.media_files for select using (true);
create policy "Service write media_files" on public.media_files for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
