// Quick preview generator for booking confirmation email (no TS tooling needed)
// Usage: node scripts/booking-preview.js
const fs = require("fs");

function renderBookingConfirmationHtml(data) {
  const {
    anredeVorname,
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
    <p>Hallo ${anredeVorname},</p>
    <p>vielen Dank für deine Buchung. Dein Platz ist fix reserviert:</p>

    <h2>Buchungsdetails</h2>
    <ul>
      <li><strong>Kurs:</strong> ${kursname}</li>
      <li><strong>Kursstart:</strong> ${terminZeile}</li>
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
      Die Anzahlungsrechnung über die bereits geleistete Zahlung erhältst du separat.<br/>
      Nach Kursende stellen wir eine Schlussrechnung über den Gesamtbetrag abzüglich der Anzahlung aus.<br/>
      Es gelten unsere AGB und Stornobedingungen: <a href="${linkAgb}">${linkAgb}</a>.
    </p>

    <h2>Firmenangaben</h2>
    <p class="muted">
      ${firmenname} · ${strasseNr} · ${plzOrt} · ${land}<br/>
      ${telefon ? `Tel. ${telefon} · ` : ""}E-Mail ${email}<br/>
      UID ${uidNr}${firmenbuchNr ? ` · Firmenbuchnr. ${firmenbuchNr}` : ""}
    </p>

    <p>Wir freuen uns auf deine Teilnahme!<br/>
    Freundliche Grüße<br/>
    ${absenderName}<br/>
    ${firmenname}</p>
  </div>
</body>
</html>`;
}

// Sample data
const html = renderBookingConfirmationHtml({
  anredeVorname: "Chris",
  kursname: "Pro Audio Basics",
  terminDatum: "12.03.2026",
  terminStartzeit: "10:00",
  terminEndzeit: null,
  terminZeitraumBeschreibung: null,
  ortZeile: "Partner X<br/>1010 Wien<br/>Wien",
  teilnehmerName: "Chris Muster",
  buchungsnummer: "MMI-123",
  gesamtpreisEur: "€ 500,00",
  bereitsBezahltEur: "€ 200,00",
  offenerBetragEur: "€ 300,00",
  zahlungsart: "Kreditkarte",
  zahlungsdatum: "12.03.2026",
  linkAgb: "https://naobgnbpvqgutxsaphci.supabase.co/storage/v1/object/public/media/2843bdf5-f579-4964-8465-e3d9d6798b42.pdf",
  firmenname: "Music Mission GmbH",
  strasseNr: "",
  plzOrt: "",
  land: "Österreich",
  telefon: "",
  email: "office@musicmission.at",
  uidNr: "ATU80644028",
  firmenbuchNr: "FN 627518 x",
  absenderName: "Music Mission GmbH",
});

fs.writeFileSync("/tmp/booking_preview.html", html);
console.log("Preview geschrieben nach /tmp/booking_preview.html");
