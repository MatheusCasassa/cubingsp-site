import { clsx } from "clsx";
import { countryName } from "@/lib/format-date";

/**
 * Bandeiras de estados brasileiros e de países (imagens WebP em
 * /public/flags, ~0,5 KB cada — fontes e licenças em /public/flags/README.md).
 * Imagem, não emoji: o Windows não desenha emoji de bandeira.
 */

export const BR_STATE_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará",
  PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

const FLAG_CLASS =
  "inline-block h-3.5 w-auto shrink-0 rounded-[2px] align-[-2px] ring-1 ring-black/15 dark:ring-white/15";

export function StateFlag({ uf, className }: { uf: string; className?: string }) {
  const name = BR_STATE_NAMES[uf] ?? uf;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/br/${uf.toLowerCase()}.webp`}
      alt={name}
      title={name}
      height={14}
      loading="lazy"
      className={clsx(FLAG_CLASS, className)}
    />
  );
}

export function CountryFlag({ iso, locale, className }: { iso: string; locale: string; className?: string }) {
  const name = countryName(iso, locale);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/country/${iso.toLowerCase()}.webp`}
      alt={name}
      title={name}
      height={14}
      loading="lazy"
      className={clsx(FLAG_CLASS, className)}
    />
  );
}

/** Bandeira de um município paulista (arquivo pelo código IBGE). */
export function CityFlag({ ibge, name, className }: { ibge: string; name: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/sp/${ibge}.webp`}
      alt={name}
      title={name}
      height={14}
      loading="lazy"
      className={clsx(FLAG_CLASS, className)}
    />
  );
}
