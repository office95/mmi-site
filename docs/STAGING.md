# Staging-Setup (Kurzfassung)

1) **Neue Supabase-Projekt-ID** anlegen (Staging).  
   - Tabellen/Policies via `supabase/supabase-schema.sql` plus alle Dateien in `supabase/migrations/` ausführen.  
   - Storage-Bucket `media` wie in Prod.

2) **.env.staging.local** im Repo (nicht commiten) mit Test-Keys:  
   ```
   NEXT_PUBLIC_SITE_URL=https://staging.musicmission.at
   NEXT_PUBLIC_SUPABASE_URL=https://<staging>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
   SUPABASE_SERVICE_ROLE_KEY=<service>

   STRIPE_SECRET_KEY=<test>
   STRIPE_WEBHOOK_SECRET=<test>
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<test>
   ```

3) **Starten:**  
   - Lokal: `NODE_ENV=development NEXT_PUBLIC_ENV=staging npm run dev` (Turbopack).  
   - Deploy: gleiches Image wie Prod, aber Staging-Env-Variablen setzen.

4) **Daten-Quellen:** In Staging nur Test-Daten füllen oder per SQL aus Prod klonen (ohne PII).

5) **E2E-Smoketests:**  
   - `PLAYWRIGHT_BASE_URL=https://staging.musicmission.at npm run test:e2e`  
   - Für Checkout-Smoke zusätzlich `TEST_SESSION_ID`, `TEST_CUSTOMER_EMAIL`, `TEST_FIRST_NAME`, `TEST_LAST_NAME`, `TEST_CITY` setzen (Stripe Testmode).
