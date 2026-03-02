import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageRow = {
  title: string;
  slug: string;
  type: "system" | "landing" | "course" | "partner" | "template";
  entity?: string | null;
  status?: string | null;
  updated_at?: string | null;
};

const APP_DIR = path.join(process.cwd(), "src/app");
const IGNORED_DIRS = new Set(["api", "admin", "_app", "_document"]);

function toTitle(slug: string) {
  if (slug === "/") return "Home";
  const last = slug.split("/").filter(Boolean).pop() ?? "";
  const cleaned = last.replaceAll(/\[|\]/g, "");
  return cleaned
    .split("-")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function classify(slug: string): PageRow["type"] {
  if (slug.includes("[")) return "template";
  if (slug === "/") return "system";
  return "landing";
}

async function collectPages(dir: string, segments: string[] = []): Promise<PageRow[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const rows: PageRow[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      const nextDir = path.join(dir, entry.name);
      const nextSegments = [...segments, entry.name];
      rows.push(...(await collectPages(nextDir, nextSegments)));
      continue;
    }

    if (!entry.isFile()) continue;
    if (!/^page\.(t|j)sx?$/.test(entry.name)) continue;

    const urlSegments = segments.filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")));
    const slug = "/" + urlSegments.join("/");
    const normalized = slug === "/" ? "/" : slug.replace(/\/+/g, "/");

    rows.push({
      title: toTitle(normalized),
      slug: normalized,
      type: classify(normalized),
      entity: null,
      status: "live",
      updated_at: null,
    });
  }

  return rows;
}

export async function GET() {
  const supabase = getSupabaseServiceClient();

  // Kurse
  const { data: courses, error: errC } = await supabase
    .from("courses")
    .select("title, slug, updated_at, status")
    .order("title", { ascending: true });
  if (errC) return NextResponse.json({ error: errC.message }, { status: 500 });

  // Partner
  const { data: partners, error: errP } = await supabase
    .from("partners")
    .select("name, slug, updated_at")
    .order("name", { ascending: true });
  if (errP) return NextResponse.json({ error: errP.message }, { status: 500 });

  const rows: PageRow[] = [];

  // Filesystem pages (auto)
  try {
    const filePages = await collectPages(APP_DIR);
    filePages.forEach((p) => rows.push(p));
  } catch (err) {
    console.error("Scan pages failed", err);
  }

  // Course & Partner instances (dynamic data)
  (courses ?? []).forEach((c) => {
    rows.push({
      title: c.title,
      slug: `/kurs/${c.slug}`,
      type: "course",
      entity: c.title,
      status: c.status ?? "live",
      updated_at: c.updated_at ?? null,
    });
  });

  (partners ?? []).forEach((p) => {
    rows.push({
      title: p.name,
      slug: `/partner/${p.slug}`,
      type: "partner",
      entity: p.name,
      status: "live",
      updated_at: p.updated_at ?? null,
    });
  });

  // Remove duplicates by slug, keep first occurrence
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    if (seen.has(r.slug)) return false;
    seen.add(r.slug);
    return true;
  });

  // Sort: system, landing/templates, then dynamic (course/partner)
  const order: Record<PageRow["type"], number> = { system: 0, landing: 1, template: 2, course: 3, partner: 4 };
  unique.sort((a, b) => {
    const t = order[a.type] - order[b.type];
    if (t !== 0) return t;
    return a.slug.localeCompare(b.slug);
  });

  return NextResponse.json({ data: unique });
}
