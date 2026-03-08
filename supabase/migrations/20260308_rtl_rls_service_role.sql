-- RLS: Service-Role darf alle Kern-Tabellen voll lesen/schreiben (inkl. neuer Spalten wie region)
-- Hinweis: service_role-Key wird nur im Backend verwendet.

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'courses' and policyname = 'Service full courses') then
    execute 'create policy "Service full courses" on public.courses for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'sessions' and policyname = 'Service full sessions') then
    execute 'create policy "Service full sessions" on public.sessions for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'partners' and policyname = 'Service full partners') then
    execute 'create policy "Service full partners" on public.partners for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'orders' and policyname = 'Service full orders') then
    execute 'create policy "Service full orders" on public.orders for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'partners_public' and policyname = 'Service full partners_public') then
    execute 'create policy "Service full partners_public" on public.partners_public for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'partner_overrides' and policyname = 'Service full partner_overrides') then
    execute 'create policy "Service full partner_overrides" on public.partner_overrides for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')';
  end if;
end $$;
