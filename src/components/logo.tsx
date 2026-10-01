export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-4xl md:text-6xl px-6 py-3 md:px-8 md:py-4" : size === "sm" ? "text-sm px-2 py-1" : "text-xl px-3 py-1.5";
  return (
    <span className="inline-block bg-violet shadow-stamp-violet">
      <span className={`relative block border-2 border-ink bg-lime font-display font-bold tracking-tight text-ink ${text}`}>
        Gove.AI
      </span>
    </span>
  );
}
