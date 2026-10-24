import { clsx } from "clsx";

/**
 * Logo oficial da CubingSP — cubo isométrico "CSP" (out/2026).
 * C vermelho no topo, S na face esquerda, P na face direita.
 *
 * Vetor inline (sem requisição extra): o S acompanha o tema —
 * preto no tema claro, branco no escuro — e C/P mantêm as cores da marca.
 * Mesmas proporções das versões oficiais em /public/brand/*.svg.
 */
export function Logo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="320 275 615 697"
      className={clsx("h-9 w-auto shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <polygon
        points="627.0,285.0 360.0,430.0 637.0,597.0 904.0,452.0 842.6,415.0 642.7,523.6 488.5,430.6 688.4,322.0"
        className="fill-logo-red"
      />
      <polygon
        points="332.0,446.0 332.0,652.0 557.0,783.0 560.0,836.0 334.0,704.0 333.0,793.0 625.0,961.0 626.0,746.0 398.0,612.0 396.0,560.0 624.0,692.0 625.0,610.0"
        className="fill-logo-black dark:fill-white"
      />
      <path
        d="M921.0,463.0 647.0,610.0 646.0,960.0 711.0,921.0 711.0,795.0 921.0,681.0Z M856.0,575.0 857.0,644.0 713.0,722.0 711.0,653.0Z"
        fillRule="evenodd"
        className="fill-logo-blue"
      />
    </svg>
  );
}

/** Wordmark "CUBING SP" em Tomorrow: CUBING na cor neutra, SP no vermelho do C. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={clsx("whitespace-nowrap font-display font-bold uppercase tracking-wide", className)}>
      Cubing <span className="text-logo-red">SP</span>
    </span>
  );
}
