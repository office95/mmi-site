-- Orders-Tabelle + Policies + Seats-Inkrement

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  email text not null,
  first_name text,
  last_name text,
  customer_name text,
  phone text,
  street text,
  zip text,
  city text,
  country text,
  dob text,
  company_name text,
  company_uid text,
  is_company boolean default false,
  consent_gdpr boolean default false,
  amount_cents int not null,
  deposit_cents int,
  currency text default 'EUR',
  status text default 'pending',
  checkout_session_id text,
  price_tier_id uuid,
  participants int default 1,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;

drop policy if exists "Public read orders" on public.orders;
drop policy if exists "Service write orders" on public.orders;

create policy "Public read orders" on public.orders for select using (true);
create policy "Service write orders" on public.orders
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- Helper-Funktion Plätze hochzählen
create or replace function public.increment_seats(p_session_id uuid, p_increment int)
returns void
language plpgsql
as $$
begin
  update public.sessions
  set seats_taken = coalesce(seats_taken,0) + coalesce(p_increment,0)
  where id = p_session_id;
end;
$$;
