/**
 * Veridion / Kerdos brand mark — a two-tone upward arrow: growth and gain
 * (Kerdos = Greek for "profit/gain"), its notched tail nodding to the "V" of
 * Veridion. Drawn as filled facets with `currentColor` (+ a lighter trailing
 * facet) so it adapts to its context — white on the teal header, teal on the
 * white login card — and stays crisp at any size.
 *
 * Single swap point: to use the official Veridion artwork, replace these paths
 * (or render an <img src="/veridion-logo.svg" />) and every call site updates.
 */
export default function BrandLogo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Veridion"
      fill="currentColor"
    >
      <path d="M12 2.5 L20.5 20 L12 15.5 Z" />
      <path d="M12 2.5 L12 15.5 L3.5 20 Z" fillOpacity={0.5} />
    </svg>
  );
}
