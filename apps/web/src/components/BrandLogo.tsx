/**
 * Official Veridion logo — the brand mark + "Veridion" wordmark, cropped from the
 * logo on veridion.com (the "AI business intelligence" tagline trimmed off).
 *
 * Two variants so it reads on either surface:
 *  - "onLight" (default): amber mark + black wordmark — for white surfaces (login).
 *  - "onDark": amber mark + white wordmark — for the teal app header.
 *
 * Source assets: apps/web/public/veridion-logo.png and veridion-logo-onteal.png.
 * Size via `className` (height-based, e.g. "h-7"); width scales to keep aspect.
 */
export default function BrandLogo({
  className = 'h-6',
  variant = 'onLight',
}: {
  className?: string;
  variant?: 'onLight' | 'onDark';
}) {
  const src = variant === 'onDark' ? '/veridion-logo-onteal.png' : '/veridion-logo.png';
  return <img src={src} alt="Veridion" className={`${className} w-auto object-contain`} />;
}
