/**
 * Bandeiras em SVG inline — NÃO usa emoji.
 * Motivo: o Windows (fonte Segoe UI Emoji) não renderiza bandeiras de
 * países por decisão corporativa; emoji de bandeira vira "BR"/"US" em
 * texto. SVG garante o visual correto em qualquer sistema.
 * viewBox 20×14, cantos arredondados.
 */

type FlagProps = { className?: string };

const wrap = "inline-block h-3.5 w-5 shrink-0 rounded-[2px] shadow-sm ring-1 ring-black/10";

/** Brasil */
export function FlagBR({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 20 14" className={`${wrap} ${className ?? ""}`} aria-hidden>
      <rect width="20" height="14" fill="#009c3b" />
      <path d="M10 1.6 18.4 7 10 12.4 1.6 7Z" fill="#ffdf00" />
      <circle cx="10" cy="7" r="3" fill="#002776" />
      <path d="M7.2 6.2a6 6 0 0 1 5.6 1.1" fill="none" stroke="#fff" strokeWidth="0.7" />
    </svg>
  );
}

/** Espanha */
export function FlagES({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 20 14" className={`${wrap} ${className ?? ""}`} aria-hidden>
      <rect width="20" height="14" fill="#aa151b" />
      <rect y="3.5" width="20" height="7" fill="#f1bf00" />
    </svg>
  );
}

/** Estados Unidos */
export function FlagUS({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 20 14" className={`${wrap} ${className ?? ""}`} aria-hidden>
      <rect width="20" height="14" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((y) => (
        <rect key={y} y={y} width="20" height="1" fill="#b22234" />
      ))}
      <rect width="9" height="7" fill="#3c3b6e" />
      <g fill="#fff">
        {[1.2, 3.2, 5.2, 7.2].map((x) =>
          [1.2, 3.2, 5.2].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.5" />)
        )}
      </g>
    </svg>
  );
}

export const FLAGS = { pt: FlagBR, es: FlagES, en: FlagUS } as const;
