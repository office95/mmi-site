## Music Mission Institute – Admin & Marketing

Stack: Next.js App Router, Supabase (DB/Storage/Auth), Stripe Checkout, TailwindCSS, SWR. App-URLs in `src/app`, Admin unter `/admin`.

### Wichtige Routen
- Öffentlich: Kursseiten `/kurs/[slug]`, Entdecken `/entdecken`, Buchen `/buchen/[sessionId]`
- Admin: `/admin` (Navigation in `src/app/admin/layout.tsx`)
- Upload: `/api/upload` → Supabase Storage `media`
- Stripe Webhook: `/api/stripe/webhook`

### Marketing Automation (neu)
- Admin-Modul: `/admin/marketing`
- API: `/api/admin/marketing` (berechnet Werbefähigkeit, Kampagnenplan, Content; upsert `marketing_campaigns` wenn Tabelle vorhanden)
- Cron-Stub: `/api/cron/marketing` (optional Header `x-cron-secret`)
- Migration: `supabase/migrations/marketing_automation.sql` (Tabellen `marketing_campaigns`, `marketing_runs`, Policies, Indizes)
- Status-Flow: not_eligible → eligible → generated → scheduled (Freigabe) → published/paused; needs_approval vorbereitet
- Keine Auto-Publishing-Calls, nur Entwürfe/Planung; Statuswechsel über UI/PATCH

### Development
- `npm run dev` (Turbopack)
- Env: `.env.local` anhand `.env.example` befüllen (Supabase, Stripe, Site-URL)

### Supabase
- Migrationen unter `supabase/migrations`
- Service Role nutzt RLS-Policies (z.B. `marketing_campaigns_service_role`)

### Tests
- Playwright Setup unter `tests/` (siehe `playwright.config.ts`)

### SEO Matrix (AT/DE)
- Admin-UI: `/admin/seo-matrix` – gepflegte Tabelle mit Title, Description, H1, Canonical, hreflang je Domain (AT/DE) und Page-Key; inkl. Zeichenlängen, Preview und Warnungen.
- Datenmodell: `public.seo_matrix` (Migration `supabase/migrations/20260312_seo_matrix.sql`), Unique `page_key + domain_variant`, RLS: Service-Role Vollzugriff, anonyme Lese-Policy.
- API: `/api/admin/seo-matrix` (GET/POST/PATCH/DELETE, Validierungen & Normalisierung von Slugs/URLs).
- Frontend: Helper `src/lib/seo-matrix.ts` (`fetchSeoForPage`, `resolvedSeoToMetadata`) lädt passende Einträge je Domain, baut Canonical/hreflang/robots und liefert H1/Hero-Subline; fällt auf Defaults zurück und loggt fehlende Einträge.
- Beispiel-Einbindung: Startseite, Entdecken, Standorte, Intensiv/Extrem, Blog, Partner werden, Über uns etc. nutzen das SEO-Matrix-Helper-Pattern.
- Automatisches Hinzufügen neuer Seiten/Templates: Zentrale Liste `src/lib/seo-registry.ts`. GET `/api/admin/seo-matrix` seedet fehlende `page_key`/Domain-Kombis (AT/DE) automatisch, damit neue Keys im Admin sofort erscheinen. Bei neuen Seiten einfach Eintrag in der Registry ergänzen.
