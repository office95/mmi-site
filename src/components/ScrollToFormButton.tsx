"use client";

export function ScrollToFormButton({ targetId = "partner-form", label = "Jetzt unverbindlich anfragen" }: { targetId?: string; label?: string }) {
  const scrollToTarget = () => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTarget}
      className="inline-flex items-center gap-2 rounded-full bg-[#ff1f8f] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#ff1f8f]/30 hover:bg-[#e0007a]"
    >
      {label}
      <span aria-hidden>→</span>
    </button>
  );
}
