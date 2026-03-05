import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServiceClient } from "@/lib/supabase";
import { SiteHeader } from "@/components/SiteHeader";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServiceClient();

  const { data: order, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !order) return notFound();

  const [courseRes, sessionRes] = await Promise.all([
    order.course_id ? supabase.from("courses").select("id,title,slug,base_price_cents,deposit_cents").eq("id", order.course_id).maybeSingle() : null,
    order.session_id
      ? supabase.from("sessions").select("id,start_date,start_time,city,state,country,partner_id,tax_rate").eq("id", order.session_id).maybeSingle()
      : null,
  ]);

  const course = courseRes?.data ?? null;
  const session = sessionRes?.data ?? null;
  const partner =
    session?.partner_id &&
    (await supabase.from("partners").select("id,name,city,state,country").eq("id", session.partner_id).maybeSingle()).data;
  const amount = (order.amount_cents ?? 0) / 100;
  const deposit = order.deposit_cents !== null ? (order.deposit_cents ?? 0) / 100 : null;
  const total = course?.base_price_cents ? course.base_price_cents / 100 : (order.amount_cents ?? 0) / 100;
  const rawTax = session?.tax_rate ?? null;
  const taxRate = rawTax !== null && rawTax !== undefined ? (rawTax > 1 ? rawTax / 100 : rawTax) : null;
  const net = taxRate ? total / (1 + taxRate) : total;
  const vat = total - net;

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Admin · Bestellung</p>
            <h1 className="font-anton text-3xl">{order.order_number ?? `Order #${id.slice(0, 8)}`}</h1>
            <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleString("de-AT")}</p>
          </div>
          <Link
            href="/admin/orders"
            className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Zurück
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2 lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">Bestellung</h2>
            <div className="flex flex-wrap gap-2 text-sm text-slate-700">
              <StatusPill status={order.status} />
              {deposit !== null && <Pill label={`Anzahlung: ${deposit.toFixed(2)} €`} />}
              <Pill label={`Teilnehmer: ${order.participants ?? 1}`} />
              {order.stripe_payment_intent && <Pill label={`PI: ${order.stripe_payment_intent}`} tone="slate" />}
            </div>
            <div className="text-sm text-slate-800 space-y-1">
              <div className="font-semibold">Kurs: {course?.title ?? "–"}</div>
              {session?.start_date && (
                <div>
                  Termin: {session.start_date}
                  {session.start_time ? ` · ${session.start_time.slice(0, 5)} Uhr` : ""}
                  {session.city ? ` · ${session.city}` : ""}
                </div>
              )}
              {partner && (
                <div className="text-slate-700">
                  Partner: {partner.name ?? "–"}
                  {partner.city ? ` · ${partner.city}` : ""}
                  {partner.state ? ` · ${partner.state}` : ""}
                  {partner.country ? ` · ${partner.country}` : ""}
                </div>
              )}
              <div className="space-y-0.5">
                <div>Gesamtpreis (brutto): {total ? `${total.toFixed(2)} €` : "–"}</div>
                {taxRate !== null && (
                  <div className="text-xs text-slate-600">
                    Enthaltene USt ({(taxRate * 100).toFixed(1)} %): {vat.toFixed(2)} €
                    <br />Netto: {net.toFixed(2)} €
                  </div>
                )}
                {("promotion_code" in order || "coupon_code" in order) && (order as any).promotion_code || (order as any).coupon_code ? (
                  <div className="text-xs text-slate-600">
                    Gutschein/Promo: {(order as any).promotion_code || (order as any).coupon_code}
                    {"discount_amount_cents" in order && (order as any).discount_amount_cents
                      ? ` (Rabatt: ${(((order as any).discount_amount_cents ?? 0) / 100).toFixed(2)} €)`
                      : ""}
                  </div>
                ) : null}
              </div>
              {order.notes && <div className="text-slate-600">Notiz: {order.notes}</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Zahlung</h2>
            <div className="text-sm text-slate-800 space-y-1">
              <div>Currency: {order.currency ?? "EUR"}</div>
              <div className="break-all">Checkout Session: {order.checkout_session_id ?? "–"}</div>
              <div className="break-all">Payment Intent: {order.stripe_payment_intent ?? "–"}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Kunde</h2>
            <div className="text-sm text-slate-800 space-y-1">
              <div className="font-semibold">{order.customer_name || `${order.first_name ?? ""} ${order.last_name ?? ""}`.trim() || "–"}</div>
              <div>{order.email}</div>
              {order.phone && <div>Telefon: {order.phone}</div>}
              {order.dob && <div>Geburtsdatum: {order.dob}</div>}
              {order.street && <div>{order.street}</div>}
              {(order.zip || order.city) && <div>{[order.zip, order.city].filter(Boolean).join(" ")}</div>}
              {order.country && <div>{order.country}</div>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Firma / DSGVO</h2>
            <div className="text-sm text-slate-800 space-y-1">
              <div>Als Firma: {order.is_company ? "Ja" : "Nein"}</div>
              {order.is_company && (
                <>
                  {order.company_name && <div>Firmenname: {order.company_name}</div>}
                  {order.company_uid && <div>UID: {order.company_uid}</div>}
                </>
              )}
              <div>DSGVO-Einwilligung: {order.consent_gdpr ? "Ja" : "Nein"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ label, tone = "pink" }: { label: string; tone?: "pink" | "slate" }) {
  const cls = tone === "pink" ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

function StatusPill({ status }: { status?: string | null }) {
  const s = (status || "?").toLowerCase();
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    canceled: "bg-slate-200 text-slate-700",
  };
  const cls = map[s] || "bg-slate-200 text-slate-700";
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{status || "?"}</span>;
}
