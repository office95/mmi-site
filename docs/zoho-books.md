# Zoho Books Anbindung (Starter)

## Env-Variablen (in `.env.local`)
```
ZB_CLIENT_ID=your_client_id
ZB_CLIENT_SECRET=your_client_secret
ZB_REFRESH_TOKEN=your_refresh_token
ZB_ORG_ID=123456789
ZB_DC=eu   # eu, com, in, au, jp, sa, ca
```

## OAuth (kurz)
- In der Zoho API Console (zur Region passend) eine Server-Based App anlegen.
- Scope z.B. `ZohoBooks.fullaccess.all` (oder enger).
- Refresh Token holen (Self Client oder regulärer OAuth-Fluss) und oben eintragen.

## Endpoints
- `GET /api/zoho/contacts?page=1&per_page=50` – listet Kontakte.
- `POST /api/zoho/invoices` – erstellt eine Rechnung; Body wird direkt an `POST /books/v3/invoices` durchgereicht. `organization_id` wird automatisch angehängt.

## Helper
- `src/lib/zohoBooks.ts` kümmert sich um Token-Refresh (cached in-memory) und signierte Requests.

## Nächste Schritte
- Stripe Webhook `payment_intent.succeeded` erweitern: nach erfolgreicher Zahlung `POST /api/zoho/invoices` mit Order-Daten aufrufen.
- Item/Tax-Mapping definieren (z.B. pro Kurs ein Zoho Item, Tax-Code je nach Land).
- Optional: Webhook von Zoho Books konsumieren, um Rechnungsstatus zurückzuspielen.
