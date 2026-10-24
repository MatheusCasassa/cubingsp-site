import { SP_CITY_FLAGS } from "./sp-city-flags";

/**
 * Código IBGE da bandeira de um município paulista (arquivo em
 * /public/flags/sp/{ibge}.webp), ou null se não houver bandeira.
 * Tolerante a acentos, maiúsculas, hífens e apóstrofos
 * ("Santa Bárbara d'Oeste" = "santa barbara d oeste").
 * Só roda no servidor: o mapa (~20 KB) não vai para o navegador.
 */
export function spCityFlag(city: string): string | null {
  const key = city
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`´-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return SP_CITY_FLAGS[key] ?? null;
}
