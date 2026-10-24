import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Logo, Wordmark } from "./logo";
import { TOOLS_HUB_URL } from "@/lib/links";

export function Footer() {
  const t = useTranslations("footer");
  const tn = useTranslations("nav");

  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <Logo />
            <Wordmark className="text-lg" />
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-fg-muted">{t("tagline")}</p>
        </div>

        <nav aria-label="Footer">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            {t("navigation")}
          </h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="text-fg-muted transition hover:text-fg" href="/sobre">{tn("about")}</Link></li>
            <li><Link className="text-fg-muted transition hover:text-fg" href="/competicoes">{tn("competitions")}</Link></li>
            <li><Link className="text-fg-muted transition hover:text-fg" href="/rankings">{tn("rankings")}</Link></li>
            <li><a className="text-fg-muted transition hover:text-fg" href={TOOLS_HUB_URL}>{tn("tools")}</a></li>
          </ul>
        </nav>

        <div className="space-y-3 text-sm text-fg-muted">
          <h3 className="text-xs font-semibold uppercase tracking-widest">{t("community")}</h3>
          <p className="leading-relaxed">{t("disclaimer")}</p>
        </div>
      </div>

      <div className="border-t border-border-subtle py-5 text-center text-xs text-fg-muted">
        © {new Date().getFullYear()} CubingSP
      </div>
    </footer>
  );
}
