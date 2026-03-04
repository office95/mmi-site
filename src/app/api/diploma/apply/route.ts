import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendMail } from "@/lib/mail";

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

  // E-Mail an office
  try {
    const lines = [
      "<h3>Neue Anmeldung – Professional Audio Diploma</h3>",
      `<p><strong>Name:</strong> ${payload.first_name} ${payload.last_name}</p>`,
      payload.birthdate ? `<p><strong>Geburtsdatum:</strong> ${payload.birthdate}</p>` : "",
      `<p><strong>E-Mail:</strong> ${payload.email}</p>`,
      payload.phone ? `<p><strong>Telefon:</strong> ${payload.phone}</p>` : "",
      payload.street || payload.zip || payload.city
        ? `<p><strong>Adresse:</strong> ${[payload.street, payload.zip, payload.city].filter(Boolean).join(", ")}</p>`
        : "",
      payload.location_preference ? `<p><strong>Kursstandort Wunsch:</strong> ${payload.location_preference}</p>` : "",
      `<p><strong>Quelle:</strong> Professional Audio Diploma</p>`,
      `<p><strong>Status:</strong> open</p>`,
    ].join("");

    await sendMail({
      to: "office@musicmission.at",
      subject: "Neue Anmeldung – Professional Audio Diploma",
      html: lines,
    });
  } catch (err) {
    console.error("Mail send failed", err);
  }

  return NextResponse.json({ ok: true, data });
}
