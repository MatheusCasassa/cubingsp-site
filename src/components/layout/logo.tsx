import { clsx } from "clsx";

/**
 * Marca simplificada da CubingSP para uso no site.
 * Grade 3×3 inclinada inspirada na logo oficial: blocos escuros e
 * brancos, com o bloco do brasão em vermelho no canto superior.
 * (A logo completa em PNG fica em /public/images/logo.png.)
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
