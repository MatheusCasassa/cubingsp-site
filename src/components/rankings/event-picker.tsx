"use client";

import { useTranslations } from "next-intl";
import { eventName, isDiscontinued } from "@/lib/rankings/events";

/** Botões das modalidades (quebra em linhas; descontinuadas no fim, em itálico). */
export function EventPicker({
  events,
  value,
  onChange,
  locale,
}: {
  events: string[];
  value: string;
  onChange: (ev: string) => void;
  locale: string;
}) {
  const t = useTranslations("rankings");
  const ordered = [...events.filter((e) => !isDiscontinued(e)), ...events.filter(isDiscontinued)];
  return (
    <div role="radiogroup" aria-label={t("event")} className="flex flex-wrap gap-1.5">
      {ordered.map((ev) => {
        const active = ev === value;
        return (
          <button
            key={ev}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(ev)}
            title={isDiscontinued(ev) ? t("discontinued") : undefined}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
              active ? "border-brand bg-brand text-brand-fg" : "border-border-subtle text-fg-muted hover:border-brand hover:text-fg"
            } ${isDiscontinued(ev) ? "italic" : ""}`}
          >
            {eventName(ev, locale)}
          </button>
        );
      })}
    </div>
  );
}
