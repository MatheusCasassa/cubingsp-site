import { clsx } from "clsx";

/**
 * Logo oficial da CubingSP (arte de artista da comunidade),
 * com fundo removido — /public/images/logo.png.
 */
export function LogoOficial({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo.png"
      alt="CubingSP"
      className={clsx("size-9 select-none", className)}
    />
  );
}

/**
 * Marca simplificada em SVG (uso alternativo/ícones).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={clsx("size-8", className)}
      aria-hidden
    >
      <g transform="rotate(-12 24 24)">
        {/* linha 1 */}
        <rect x="6" y="6" width="10" height="10" rx="2.5" className="fill-accent-red" />
        <rect x="19" y="6" width="10" height="10" rx="2.5" className="fill-ink-800 dark:fill-ink-700" />
        <rect x="32" y="6" width="10" height="10" rx="2.5" className="fill-ink-800 dark:fill-ink-700" />
        {/* linha 2 */}
        <rect x="6" y="19" width="10" height="10" rx="2.5" className="fill-white stroke-ink-600/30" />
        <rect x="19" y="19" width="10" height="10" rx="2.5" className="fill-white stroke-ink-600/30" />
        <rect x="32" y="19" width="10" height="10" rx="2.5" className="fill-ink-800 dark:fill-ink-700" />
        {/* linha 3 */}
        <rect x="6" y="32" width="10" height="10" rx="2.5" className="fill-ink-800 dark:fill-ink-700" />
        <rect x="19" y="32" width="10" height="10" rx="2.5" className="fill-white stroke-ink-600/30" />
        <rect x="32" y="32" width="10" height="10" rx="2.5" className="fill-ink-800 dark:fill-ink-700" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("font-black tracking-tight", className)}>
      CUBING<span className="text-accent-red">SP</span>
    </span>
  );
}
