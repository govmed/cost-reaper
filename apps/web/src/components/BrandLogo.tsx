/**
 * Veridion wordmark — the "Veridion" wordmark only (the orange brand mark was
 * dropped), cropped from the logo on veridion.com.
 *
 * Two variants so it reads on either surface:
 *  - "onLight" (default): black wordmark — for white surfaces (login).
 *  - "onDark": white wordmark — for the teal app header.
 *
 * Source assets: apps/web/public/veridion-wordmark.png and veridion-wordmark-onteal.png.
 * Size via `className` (height-based, e.g. "h-7"); width scales to keep aspect.
 */
export default function BrandLogo({
  className = 'h-6',
  variant = 'onLight',
}: {
  className?: string;
  variant?: 'onLight' | 'onDark';
}) {
  const src = variant === 'onDark' ? '/veridion-wordmark-onteal.png' : '/veridion-wordmark.png';
  return <img src={src} alt="Veridion" className={`${className} w-auto object-contain`} />;
}
