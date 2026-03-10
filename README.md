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
