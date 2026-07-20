import { clsx } from "clsx";
import { useTranslations } from "next-intl";

/**
 * Espaço reservado para foto.
 * Enquanto `src` não for definido, renderiza um placeholder elegante;
 * quando a foto chegar, basta passar src/alt — o layout não muda.
 */
export function ImageSlot({
  src,
  alt = "",
  className,
  aspect = "aspect-[4/3]",
}: {
  src?: string;
  alt?: string;
  className?: string;
  aspect?: string;
}) {
  const t = useTranslations("common");

  if (src) {
    return (
      <div className={clsx("overflow-hidden rounded-2xl", aspect, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={t("photoSoon")}
      className={clsx(
        "flex items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-bg-elevated",
        aspect,
        className
      )}
    >
      <div className="flex flex-col items-center gap-2 text-fg-muted">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-3.5-3.5a2 2 0 0 0-2.8 0L6 20" />
        </svg>
        <span className="text-xs font-medium">{t("photoSoon")}</span>
      </div>
    </div>
  );
}
