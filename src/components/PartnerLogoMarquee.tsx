"use client";

type PartnerLogo = {
  name: string | null;
  logo: string | null;
};

type PartnerLogoMarqueeProps = {
  logos: PartnerLogo[];
};

export function PartnerLogoMarquee({ logos }: PartnerLogoMarqueeProps) {
  const items = logos.length > 0 ? [...logos, ...logos] : [];

  if (!items.length) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm text-white/70">
        Noch keine Partner-Logos vorhanden
      </div>
    );
  }

  return (
    <div className="marquee">
      <div className="marquee-track animate-marquee" style={{ animationDuration: "14s" }}>
        {items.map((item, idx) => (
          <div
            key={`${item.name ?? "logo"}-${idx}`}
            className="relative flex items-center justify-center w-[20vh] h-[20vh] min-w-[160px] min-h-[160px] max-w-[220px] max-h-[220px] overflow-hidden rounded-2xl bg-transparent"
          >
            {item.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logo}
                alt={item.name ?? "Partner Logo"}
                className="object-cover w-full h-full mix-blend-multiply"
                loading="lazy"
                onError={(e) => {
                  // falls Bild fehlschlägt, auf Placeholder umschalten
                  const target = e.currentTarget;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-[#ff1f8f]/40 to-black/60 text-xs font-semibold uppercase tracking-wide text-white/80">
              {item.name ?? "Partner"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
