export type AutoBadgeRule = {
  id: string;
  name: string;
  color: string;
  slug?: string | null;
  scope?: "course" | "partner" | "both" | null;
  auto_type?: string | null;
};

export type SessionBadgeContext = {
  courseTypeName?: string | null;
  courseCreatedAt?: string | null;
  maxParticipants?: number | null;
  seatsTaken?: number | null;
};

type ParsedRule =
  | { kind: "type"; value: string }
  | { kind: "seats"; op: "<=" | "<" | ">=" | ">"; value: number }
  | { kind: "age"; days: number };

const normalize = (val?: string | null) => (val ? val.trim().toLowerCase() : "");

export function parseAutoRule(autoType?: string | null): ParsedRule | null {
  if (!autoType) return null;
  const raw = autoType.trim().toLowerCase();
  if (!raw) return null;

  if (raw.startsWith("type:")) {
    const value = raw.replace(/^type:\s*/, "");
    if (!value) return null;
    return { kind: "type", value };
  }

  if (raw.startsWith("seats:")) {
    const match = raw.match(/^seats:\s*(<=|>=|<|>)?\s*(\d+)/);
    if (!match) return null;
    const op = (match[1] as ParsedRule["op"]) || "<=";
    const value = Number(match[2]);
    if (Number.isNaN(value)) return null;
    return { kind: "seats", op, value };
  }

  if (raw.startsWith("age:")) {
    const match = raw.match(/^age:\s*(\d+)/);
    if (!match) return null;
    const days = Number(match[1]);
    if (Number.isNaN(days)) return null;
    return { kind: "age", days };
  }

  return null;
}

function evalRule(rule: ParsedRule, ctx: SessionBadgeContext): boolean {
  switch (rule.kind) {
    case "type": {
      const type = normalize(ctx.courseTypeName);
      return !!type && type.includes(rule.value);
    }
    case "seats": {
      if (ctx.maxParticipants == null) return false;
      const max = Number(ctx.maxParticipants);
      if (!Number.isFinite(max) || max <= 0) return false;
      const taken = Number(ctx.seatsTaken ?? 0);
      const left = Math.max(0, max - taken);
      if (rule.op === "<=") return left <= rule.value;
      if (rule.op === "<") return left < rule.value;
      if (rule.op === ">=") return left >= rule.value;
      return left > rule.value;
    }
    case "age": {
      if (!ctx.courseCreatedAt) return false;
      const created = new Date(ctx.courseCreatedAt);
      if (Number.isNaN(created.getTime())) return false;
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= rule.days;
    }
    default:
      return false;
  }
}

export function collectSessionBadges(badges: AutoBadgeRule[], ctx: SessionBadgeContext) {
  const result: { name: string; color: string; slug?: string | null; id: string }[] = [];
  for (const badge of badges) {
    if (!badge.auto_type) continue;
    const rule = parseAutoRule(badge.auto_type);
    if (!rule) continue;
    if (evalRule(rule, ctx)) {
      result.push({ id: badge.id, name: badge.name, color: badge.color, slug: badge.slug });
    }
  }
  return result;
}
