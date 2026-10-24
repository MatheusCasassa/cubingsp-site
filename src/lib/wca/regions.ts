/**
 * Regiões das competições (São Paulo / Brasil / LATAM) e leitura das
 * sedes de competições com várias sedes (FM "multi-location").
 *
 * A WCA não expõe as sedes de FM de forma estruturada: o WCIF traz só uma
 * sede genérica e as cidades reais ficam numa aba da competição, numa
 * tabela em markdown. Cada organizador usa um formato, por exemplo:
 *   | São Paulo/SP | …                      (Campeonato Brasileiro de FMC)
 *   # Brasil  +  | Curitiba, Paraná | …     (FMC Sul-Americano)
 *   | España | Albacete | …                 (coluna de país)
 *   | Bogotá | …                            (nacional: país da competição)
 * O parser abaixo lê só tabelas cujo cabeçalho fala de cidade/sede/país,
 * para não confundir tabelas de premiação, cronograma etc. com sedes.
 */

/** Países da América Latina considerados na aba LATAM (o Brasil tem aba própria). */
export const LATAM_COUNTRIES = [
  "AR", "BO", "CL", "CO", "EC", "PY", "PE", "UY", "VE",
  "MX", "GT", "SV", "HN", "NI", "CR", "PA", "CU", "DO", "PR",
] as const;

/** Países fora da América do Sul consultados um a um na API da WCA. */
export const LATAM_OUTSIDE_SOUTH_AMERICA = ["MX", "GT", "SV", "HN", "NI", "CR", "PA", "CU", "DO", "PR"];

const BR_STATES: Record<string, string> = {
  AC: "acre", AL: "alagoas", AP: "amapa", AM: "amazonas", BA: "bahia", CE: "ceara",
  DF: "distrito federal", ES: "espirito santo", GO: "goias", MA: "maranhao",
  MT: "mato grosso", MS: "mato grosso do sul", MG: "minas gerais", PA: "para",
  PB: "paraiba", PR: "parana", PE: "pernambuco", PI: "piaui", RJ: "rio de janeiro",
  RN: "rio grande do norte", RS: "rio grande do sul", RO: "rondonia", RR: "roraima",
  SC: "santa catarina", SP: "sao paulo", SE: "sergipe", TO: "tocantins",
};
const UF_BY_STATE_NAME = Object.fromEntries(Object.entries(BR_STATES).map(([uf, n]) => [n, uf]));

/**
 * Cidades paulistas comuns em competições — usadas quando a sede vem só
 * como "Cidade, Brasil" (sem estado), para não perder sedes de SP.
 */
const SP_CITIES = new Set(
  [
    "sao paulo", "campinas", "santos", "sao jose dos campos", "ribeirao preto", "sorocaba",
    "jundiai", "piracicaba", "bauru", "sao jose do rio preto", "guarulhos", "santo andre",
    "sao bernardo do campo", "sao caetano do sul", "osasco", "mogi das cruzes", "sumare",
    "jau", "franca", "marilia", "presidente prudente", "araraquara", "sao carlos", "limeira",
    "americana", "taubate", "itapeva", "cubatao", "barueri", "diadema", "indaiatuba",
    "atibaia", "braganca paulista", "botucatu", "rio claro", "valinhos", "vinhedo",
    "hortolandia", "praia grande", "sao vicente", "guaruja", "carapicuiba", "cotia",
  ].map(norm),
);

/** Nomes de países (PT/ES/EN, sem acento) → ISO2. Inclui países fora da LATAM para excluí-los. */
const COUNTRY_BY_NAME: Record<string, string> = {
  brasil: "BR", brazil: "BR",
  argentina: "AR", bolivia: "BO", chile: "CL", colombia: "CO", ecuador: "EC", equador: "EC",
  paraguay: "PY", paraguai: "PY", peru: "PE", uruguay: "UY", uruguai: "UY", venezuela: "VE",
  mexico: "MX", guatemala: "GT", "el salvador": "SV", honduras: "HN", nicaragua: "NI",
  "costa rica": "CR", panama: "PA", cuba: "CU", "republica dominicana": "DO",
  "dominican republic": "DO", "puerto rico": "PR", "porto rico": "PR",
  portugal: "PT", espana: "ES", espanha: "ES", spain: "ES", angola: "AO",
  mocambique: "MZ", mozambique: "MZ", "cabo verde": "CV", "cape verde": "CV",
  "estados unidos": "US", "united states": "US", usa: "US", eua: "US", canada: "CA",
};

export interface Venue {
  label: string; // ex.: "São Paulo/SP", "Albacete", "Bogotá"
  country: string | null; // ISO2
  uf: string | null; // estado brasileiro, quando a sede é no Brasil
}

/** Minúsculas, sem acentos, sem markdown — para comparar nomes. */
export function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[#*_`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Remove links/imagens/ênfase de uma célula markdown e devolve o texto visível. */
function cleanCell(s: string): string {
  return s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // imagens
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → texto
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function countryFromName(s: string): string | null {
  return COUNTRY_BY_NAME[norm(s)] ?? null;
}

const HEADER_RE = /^(cidade|city|ciudad|pais|country|sede|local|lugar|ubicacion)\b/;

/**
 * Lê as sedes de uma competição com várias sedes a partir do conteúdo
 * markdown das abas. `compCountry` é o país da competição (ex.: "BR" para
 * o Brasileiro de FMC, "XS" para multi-país), usado quando a tabela não diz.
 */
export function parseMultiVenues(tabContents: string[], compCountry: string): Venue[] {
  const realCompCountry = /^X/.test(compCountry) ? null : compCountry;
  const venues = new Map<string, Venue>();
  let currentCountry: string | null = null;

  for (const content of tabContents) {
    let inVenueTable = false;
    for (const raw of content.split("\n")) {
      const line = raw.trim();

      if (line.startsWith("#")) {
        const c = countryFromName(line.replace(/#/g, ""));
        if (c) currentCountry = c;
        inVenueTable = false;
        continue;
      }
      if (!line.startsWith("|")) {
        inVenueTable = false;
        continue;
      }

      const cells = line.replace(/^\||\|$/g, "").split("|").map(cleanCell);
      if (cells.every((c) => /^:?-*:?$/.test(c))) continue; // separador | --- |

      const first = norm(cells[0] ?? "");
      if (HEADER_RE.test(first)) {
        inVenueTable = true; // cabeçalho de tabela de sedes
        continue;
      }
      if (!inVenueTable || !first) continue;

      let country: string | null = null;
      let uf: string | null = null;
      let city = cells[0];

      const colCountry = countryFromName(cells[0]);
      if (colCountry && cells[1]) {
        // formato "| España | Albacete |" ou "| Brazil | São Paulo, São Paulo |"
        country = colCountry;
        city = cells[1];
      }
      // País implícito: o da coluna, senão o do título "# Brasil", senão o da competição
      const implicit = country ?? currentCountry ?? realCompCountry;

      const ufMatch = city.match(/^(.*?)\s*[/\-–]\s*([A-Za-z]{2})$/);
      const commaIdx = city.lastIndexOf(",");
      if (ufMatch && BR_STATES[ufMatch[2].toUpperCase()] && (!country || country === "BR")) {
        // "São Paulo/SP" ou "Campinas - SP"
        city = ufMatch[1];
        uf = ufMatch[2].toUpperCase();
        country = "BR";
      } else if (commaIdx > 0) {
        // "Curitiba, Paraná" | "Lima, Peru" | "Río Grande, Tierra del Fuego"
        const tail = city.slice(commaIdx + 1);
        const stateUf = UF_BY_STATE_NAME[norm(tail)];
        const tailCountry = countryFromName(tail);
        city = city.slice(0, commaIdx);
        if (tailCountry) {
          country = country ?? tailCountry;
        } else if (stateUf && implicit === "BR") {
          country = "BR";
          uf = stateUf;
        } else {
          country = implicit;
        }
      } else {
        country = implicit;
      }

      city = city.trim();
      if (!city || city.length > 60 || /https?:|!\[/.test(city)) continue;
      if (country === "BR" && !uf && SP_CITIES.has(norm(city))) uf = "SP";

      const label = country === "BR" && uf ? `${city}/${uf}` : city;
      const key = `${country}|${norm(label)}`;
      if (!venues.has(key)) venues.set(key, { label, country, uf });
    }
  }
  return [...venues.values()];
}

/** UF de uma competição brasileira de sede única ("Campinas, São Paulo" → "SP"). */
export function ufFromWcaCity(city: string): string | null {
  const idx = city.lastIndexOf(",");
  if (idx < 0) return null;
  return UF_BY_STATE_NAME[norm(city.slice(idx + 1))] ?? null;
}
