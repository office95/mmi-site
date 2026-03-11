import "server-only";

export type BookingConfirmationData = {
  anredeNachname: string;
  kursname: string;
  terminDatum: string;
  terminStartzeit?: string | null;
  terminEndzeit?: string | null;
  terminZeitraumBeschreibung?: string | null;
  ortZeile: string;
  teilnehmerName: string;
  buchungsnummer: string;
  gesamtpreisEur: string;
  bereitsBezahltEur: string;
  offenerBetragEur: string;
  zahlungsart: string;
  zahlungsdatum: string;
  linkAgb: string;
  firmenname: string;
  strasseNr: string;
  plzOrt: string;
  land: string;
  telefon: string;
  email: string;
  uidNr: string;
  firmenbuchNr?: string;
  absenderName: string;
};

export function renderBookingConfirmationHtml(data: BookingConfirmationData) {
  const {
    anredeNachname,
    kursname,
    terminDatum,
    terminStartzeit,
    terminEndzeit,
    terminZeitraumBeschreibung,
    ortZeile,
    teilnehmerName,
    buchungsnummer,
    gesamtpreisEur,
    bereitsBezahltEur,
    offenerBetragEur,
    zahlungsart,
    zahlungsdatum,
    linkAgb,
    firmenname,
    strasseNr,
    plzOrt,
    land,
    telefon,
    email,
    uidNr,
    firmenbuchNr,
    absenderName,
  } = data;

  const terminZeile = [terminDatum, terminStartzeit ? `von ${terminStartzeit}` : null, terminEndzeit ? `bis ${terminEndzeit}` : null, terminZeitraumBeschreibung]
    .filter(Boolean)
    .join(" ");

  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; color:#111; margin:0; padding:24px; background:#f7f7f8; }
    .card { max-width:700px; margin:auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:28px; }
    h1 { font-size:22px; margin:0 0 12px; }
    h2 { font-size:16px; margin:22px 0 10px; }
    p { line-height:1.6; margin:0 0 12px; }
    ul { padding-left:18px; margin:0; }
    li { margin:4px 0; }
    .muted { color:#555; font-size:14px; }
    .divider { border-top:1px solid #e5e7eb; margin:20px 0; }
    a { color:#0d6efd; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Buchungsbestätigung – ${kursname} am ${terminDatum}</h1>
    <p>Sehr geehrte/r ${anredeNachname},</p>
    <p>vielen Dank für Ihre Buchung. Hiermit bestätigen wir verbindlich Ihre Teilnahme am folgenden Kurs:</p>

    <h2>Buchungsdetails</h2>
    <ul>
      <li><strong>Kurs:</strong> ${kursname}</li>
      <li><strong>Termin:</strong> ${terminZeile}</li>
      <li><strong>Kursort:</strong> ${ortZeile}</li>
      <li><strong>Teilnehmer/in:</strong> ${teilnehmerName}</li>
      <li><strong>Buchungsnummer:</strong> ${buchungsnummer}</li>
    </ul>

    <h2>Zahlung & Betrag</h2>
    <ul>
      <li><strong>Gesamtpreis (brutto):</strong> ${gesamtpreisEur}</li>
      <li><strong>Bereits bezahlt (Anzahlung):</strong> ${bereitsBezahltEur} am ${zahlungsdatum} per ${zahlungsart}</li>
      <li><strong>Offener Betrag:</strong> ${offenerBetragEur} (fällig zum Kursstart)</li>
    </ul>

    <div class="divider"></div>

    <h2>Hinweise</h2>
    <p class="muted">
      Diese Buchungsbestätigung ist keine Rechnung.<br/>
      Die Anzahlungsrechnung über die bereits geleistete Zahlung erhalten Sie separat.<br/>
      Nach Kursende stellen wir eine Schlussrechnung über den Gesamtbetrag abzüglich der Anzahlung aus.<br/>
      Es gelten unsere AGB und Stornobedingungen: <a href="${linkAgb}">${linkAgb}</a>.
    </p>

    <h2>Firmenangaben</h2>
    <p class="muted">
      ${firmenname} · ${strasseNr} · ${plzOrt} · ${land}<br/>
      Tel. ${telefon} · E-Mail ${email}<br/>
      UID ${uidNr}${firmenbuchNr ? ` · Firmenbuchnr. ${firmenbuchNr}` : ""}
    </p>

    <p>Wir freuen uns auf Ihre Teilnahme!<br/>
    Freundliche Grüße<br/>
    ${absenderName}<br/>
    ${firmenname}</p>
  </div>
</body>
</html>`;
}
