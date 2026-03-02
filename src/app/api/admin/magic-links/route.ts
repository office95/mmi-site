import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { sendMail } from "@/lib/mail";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("magic_links")
    .select("id,partner_id,token,expires_at,max_uses,use_count,used_at,note,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceClient();
  const body = await req.json();

  const payload = {
    id: randomUUID(),
    partner_id: body.partner_id ?? null,
    token: randomUUID(),
    expires_at: body.expires_at ?? null,
    max_uses: body.max_uses ?? 1,
    note: body.note ?? null,
  };

  const { data, error } = await supabase.from("magic_links").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Build link
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3005";
  const magicLink = `${base.replace(/\/$/, "")}/partner-blog/create?token=${data.token}`;

  // Optional email to partner
  if (payload.partner_id) {
    const { data: partner } = await supabase.from("partners").select("email,name").eq("id", payload.partner_id).maybeSingle();
    const to = partner?.email;
    if (to) {
      const bodyHtml = `
        <p>Hallo${partner?.name ? " " + partner.name : ""},</p>
        <p>hier ist dein persönlicher Magic-Link für deinen Blogbeitrag auf unserer Website:</p>
        <p><a href="${magicLink}">👉 Magic-Link öffnen</a></p>
        <p>Gerne kannst du deinen Kursort, Eindrücke aus bereits stattgefundenen Kursen (inkl. Bilder), oder Einblicke in deine Arbeit präsentieren.</p>
        <p>Ebenso freuen wir uns über fachliche Beiträge wie:</p>
        <ul>
          <li>Workflow-Einblicke</li>
          <li>Produktions-Tipps</li>
          <li>Mixing-/Recording-Techniken</li>
          <li>DJ- oder Performance-Tipps</li>
          <li>Praxisnahe Learnings aus dem Kursalltag</li>
        </ul>
        <p>Dein Beitrag stärkt deine Sichtbarkeit und unser gemeinsames Netzwerk.</p>
        <p>Vielen Dank für deine Unterstützung!</p>
        <p>Musikalische Grüße<br/>Dein Music Mission Team<br/>www.musicmission.at</p>
      `;
      await sendMail({
        to,
        subject: "Dein Magic-Link für den MMI Blog",
        html: bodyHtml,
      });
    }
  }

  return NextResponse.json({ data: { ...data, link: magicLink } });
}
