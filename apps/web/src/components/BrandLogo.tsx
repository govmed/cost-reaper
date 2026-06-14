/**
 * Veridion brand mark — the official Veridion "V" logo (amber, transparent), so
 * it sits cleanly on both the teal header and the white login card.
 *
 * Source asset: apps/web/public/veridion-mark.png. Size it via `className`
 * (height-based, e.g. "h-7"); the width scales to keep the aspect ratio.
 */
export default function BrandLogo({ className = 'h-6' }: { className?: string }) {
  return (
    <img src="/veridion-mark.png" alt="Veridion" className={`${className} w-auto object-contain`} />
  );
}
