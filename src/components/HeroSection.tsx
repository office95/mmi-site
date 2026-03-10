import Image from "next/image";
import clsx from "clsx";

type Align = "left" | "center";

type HeroSectionProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image: string;
  overlayStrength?: "soft" | "strong";
  align?: Align;
  heightClass?: string;
  children?: React.ReactNode;
};

const overlayMap = {
  soft: "from-black/60 via-black/35 to-black/15",
  strong: "from-black/75 via-black/50 to-black/20",
};

export default function HeroSection({
  eyebrow,
  title,
  subtitle,
  image,
  overlayStrength = "strong",
  align = "center",
  heightClass = "h-[50vh] sm:h-[55vh] lg:h-[60vh] min-h-[420px]",
  children,
}: HeroSectionProps) {
  const isCenter = align === "center";

  return (
    <section className={clsx("relative w-full overflow-hidden text-white", heightClass)}>
      <Image src={image} alt={title} fill priority sizes="100vw" className="object-cover" />
      <div className={clsx("absolute inset-0 bg-gradient-to-b", overlayMap[overlayStrength])} />
      <div
        className={clsx(
          "absolute inset-0 flex",
          isCenter ? "items-center justify-center text-center" : "items-center justify-start",
          "px-6 sm:px-10 lg:px-16"
        )}
      >
        <div className={clsx("space-y-4", isCenter ? "max-w-4xl" : "max-w-3xl")}>
          {eyebrow ? (
            <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-white/70">{eyebrow}</p>
          ) : null}
          <h1 className="font-anton text-4xl sm:text-5xl lg:text-6xl leading-[1.05] drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            {title}
          </h1>
          {subtitle ? (
            <p className="text-base sm:text-lg leading-relaxed text-white/85 drop-shadow-[0_6px_18px_rgba(0,0,0,0.28)]">{subtitle}</p>
          ) : null}
          {children ? <div className="pt-2 flex flex-wrap gap-3">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
