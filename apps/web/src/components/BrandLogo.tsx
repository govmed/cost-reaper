/**
 * Veridion brand mark — a stylized "V" that rises into a growth arrow (Kerdos =
 * Greek for "profit/gain"). Drawn with `currentColor` so it adapts to its
 * context: white on the teal header, teal on the white login card.
 *
 * To swap in the official Veridion logo later, replace the SVG paths here (or
 * point this at an <img src="/veridion-logo.svg" />) — the call sites won't change.
 */
export default function BrandLogo({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role="img"
      aria-label="Veridion"
    >
      <path d="M4 6 L10 18 L20 4" />
      <path d="M20 4 L13.5 4 M20 4 L20 10.5" />
    </svg>
  );
}
