import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendAutomationMail } from "@/lib/automationMailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json().catch(() => ({}));

  const {
    first_name,
    last_name,
    birthdate,
    phone,
    email,
    street,
    zip,
    city,
    location_preference,
    consent,
  } = body || {};

  if (!first_name || !last_name || !email || !consent) {
    return NextResponse.json({ error: "Pflichtfelder fehlen" }, { status: 400 });
  }

  const payload = {
    first_name: String(first_name).trim(),
    last_name: String(last_name).trim(),
    birthdate: birthdate ? String(birthdate) : null,
    phone: phone ? String(phone) : null,
    email: String(email).trim().toLowerCase(),
    street: street ? String(street) : null,
    zip: zip ? String(zip) : null,
    city: city ? String(city) : null,
    location_preference: location_preference ? String(location_preference) : null,
    consent: Boolean(consent),
    status: "open",
    source: "professional-audio-diploma",
  };

  const { data, error } = await supabase.from("diploma_applications").insert(payload).select("*").maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // E-Mail an office (Automation)
  try {
    await sendAutomationMail({
      key: "diploma_application_admin",
      to: "office@musicmission.at",
      tokens: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone || "",
        birthdate: payload.birthdate || "",
        address: [payload.street, payload.zip, payload.city].filter(Boolean).join(", "),
        location_preference: payload.location_preference || "",
        status: "open",
      },
      fallbackSubject: "Neue Anmeldung – Professional Audio Diploma",
      fallbackHtml: [
        "<h3>Neue Anmeldung – Professional Audio Diploma</h3>",
        `<p><strong>Name:</strong> {{first_name}} {{last_name}}</p>`,
        `<p><strong>Geburtsdatum:</strong> {{birthdate}}</p>`,
        `<p><strong>E-Mail:</strong> {{email}}</p>`,
        `<p><strong>Telefon:</strong> {{phone}}</p>`,
        `<p><strong>Adresse:</strong> {{address}}</p>`,
        `<p><strong>Kursstandort Wunsch:</strong> {{location_preference}}</p>`,
        `<p><strong>Status:</strong> {{status}}</p>`,
      ].join(""),
    });
  } catch (err) {
    console.error("Mail send failed", err);
  }

  // E-Mail an Bewerber/in (Automation)
  try {
    await sendAutomationMail({
      key: "diploma_application_customer",
      to: payload.email,
      tokens: {
        first_name: payload.first_name,
        last_name: payload.last_name,
      },
      fallbackSubject: "Eingangsbestätigung – Professional Audio Diploma",
      fallbackHtml: `<p>Hallo {{first_name}},</p>
        <p>vielen Dank für deine Anmeldung zum Professional Audio Diploma. Wir melden uns in Kürze mit weiteren Infos.</p>
        <p>Liebe Grüße<br/>Music Mission</p>`,
    });
  } catch (err) {
    console.error("Customer mail failed", err);
  }

  return NextResponse.json({ ok: true, data });
}
