import { unstable_cache } from "next/cache";
import {
  LATAM_COUNTRIES,
  LATAM_OUTSIDE_SOUTH_AMERICA,
  parseMultiVenues,
  ufFromWcaCity,
  type Venue,
} from "./regions";

/**
 * Próximas competições oficiais (API pública da WCA), separadas em:
 *   - sp:    sedes no estado de São Paulo
 *   - br:    sedes no Brasil fora de SP
 *   - latam: sedes nos demais países da América Latina (filtro por país)
 * As regiões não se sobrepõem; uma competição com várias sedes (FM)
 * aparece em cada região onde tiver sede.
 *
 * Custo: ~13 chamadas à WCA por atualização, no máximo 1x por hora
 * (unstable_cache) — nunca por visitante.
 */

const WCA_API = "https://www.worldcubeassociation.org/api/v0";
const REVALIDATE_SECONDS = 3600;
export const COMPETICOES_TAG = "competicoes-wca";

interface WcaCompetition {
  id: string;
  name: string;
  url: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  cancelled_at: string | null;
  event_ids: string[];
}

export interface CompetitionItem {
  id: string;
  name: string;
  url: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  /** Local para exibir em competições de sede única (ex.: "Campinas/SP"). */
  place: string;
  /** País (ISO2) da sede única; null em competições com várias sedes. */
  country: string | null;
  /** Estado (UF) da sede única no Brasil, para a bandeira. */
  uf: string | null;
  /** Só tem a modalidade FM (3x3x3 Menos Movimentos). */
  fmOnly: boolean;
  /** Competição com várias sedes ("Multiple cities"). */
  multiLocation: boolean;
  /** Sedes desta região (só em competições com várias sedes). */
  venues: { label: string; country: string | null; uf: string | null }[];
  /** Países desta competição na região (filtro da aba LATAM). */
  countries: string[];
}

export interface CompetitionsByRegion {
  sp: CompetitionItem[];
  br: CompetitionItem[];
  latam: CompetitionItem[];
  /** Países com competições na aba LATAM (para o filtro). */
  latamCountries: string[];
  updatedAt: string;
}

const isLatam = (c: string | null): c is string =>
  !!c && (LATAM_COUNTRIES as readonly string[]).includes(c);

/** Data de hoje no fuso de São Paulo (YYYY-MM-DD). */
function todaySaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

async function wcaFetch<T>(path: string): Promise<{ data: T; total: number } | null> {
  try {
    const res = await fetch(`${WCA_API}${path}`, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const total = Number(res.headers.get("total") ?? "0");
    return { data: (await res.json()) as T, total };
  } catch {
    return null; // WCA fora do ar: a página mostra o estado vazio, sem quebrar
  }
}

/** Lista paginada de competições a partir de hoje para um filtro (país ou continente). */
async function listUpcoming(filter: string, start: string): Promise<WcaCompetition[]> {
  const out: WcaCompetition[] = [];
  for (let page = 1; page <= 5; page++) {
    const r = await wcaFetch<WcaCompetition[]>(
      `/competitions?${filter}&start=${start}&sort=start_date&per_page=100&page=${page}`,
    );
    if (!r) break;
    out.push(...r.data);
    if (r.data.length < 100 || out.length >= r.total) break;
  }
  return out;
}

async function loadVenues(c: WcaCompetition): Promise<Venue[]> {
  const r = await wcaFetch<{ content: string }[]>(`/competitions/${c.id}/tabs`);
  return r ? parseMultiVenues(r.data.map((t) => t.content ?? ""), c.country_iso2) : [];
}

function placeOf(c: WcaCompetition): string {
  if (c.country_iso2 === "BR") {
    const uf = ufFromWcaCity(c.city);
    const cityName = c.city.split(",")[0].trim();
    return uf ? `${cityName}/${uf}` : cityName;
  }
  return c.city.split(",")[0].trim();
}

export async function fetchCompetitionsByRegion(start: string): Promise<CompetitionsByRegion> {
  const lists = await Promise.all([
    listUpcoming("continent=_South%20America", start), // Brasil + América do Sul + FM sul-americano (XS)
    ...LATAM_OUTSIDE_SOUTH_AMERICA.map((cc) => listUpcoming(`country_iso2=${cc}`, start)),
    listUpcoming("country_iso2=XM", start), // várias sedes nas Américas
    listUpcoming("country_iso2=XW", start), // várias sedes no mundo
  ]);

  const byId = new Map<string, WcaCompetition>();
  for (const c of lists.flat()) if (!c.cancelled_at) byId.set(c.id, c);
  const all = [...byId.values()].sort(
    (a, b) => a.start_date.localeCompare(b.start_date) || a.name.localeCompare(b.name),
  );

  const sp: CompetitionItem[] = [];
  const br: CompetitionItem[] = [];
  const latam: CompetitionItem[] = [];

  await Promise.all(
    all.map(async (c) => {
      const multiLocation = /multiple/i.test(c.city) || /^X/.test(c.country_iso2);
      const base = {
        id: c.id,
        name: c.name,
        url: c.url,
        startDate: c.start_date,
        endDate: c.end_date,
        fmOnly: c.event_ids.length === 1 && c.event_ids[0] === "333fm",
        multiLocation,
      };

      if (!multiLocation) {
        const item: CompetitionItem = {
          ...base,
          place: placeOf(c),
          country: c.country_iso2,
          uf: c.country_iso2 === "BR" ? ufFromWcaCity(c.city) : null,
          venues: [],
          countries: [c.country_iso2],
        };
        if (c.country_iso2 === "BR") (ufFromWcaCity(c.city) === "SP" ? sp : br).push(item);
        else if (isLatam(c.country_iso2)) latam.push(item);
        return;
      }

      const venues = await loadVenues(c);
      const spVenues = venues.filter((v) => v.country === "BR" && v.uf === "SP");
      const brVenues = venues.filter((v) => v.country === "BR" && v.uf !== "SP");
      const latamVenues = venues.filter((v) => isLatam(v.country));
      const make = (vs: Venue[]): CompetitionItem => ({
        ...base,
        place: "",
        country: null,
        uf: null,
        venues: vs.map((v) => ({ label: v.label, country: v.country, uf: v.uf })),
        countries: [...new Set(vs.map((v) => v.country).filter(isLatam))],
      });

      if (spVenues.length) sp.push(make(spVenues));
      if (brVenues.length) br.push(make(brVenues));
      if (latamVenues.length) latam.push(make(latamVenues));
      // Não deu para ler as sedes: classifica pelo país da competição
      if (!venues.length) {
        if (c.country_iso2 === "BR") br.push(make([]));
        else if (isLatam(c.country_iso2) || c.country_iso2 === "XS") latam.push(make([]));
      }
    }),
  );

  const byDate = (a: CompetitionItem, b: CompetitionItem) =>
    a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name);
  sp.sort(byDate);
  br.sort(byDate);
  latam.sort(byDate);

  return {
    sp,
    br,
    latam,
    latamCountries: [...new Set(latam.flatMap((c) => c.countries))].sort(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Versão cacheada (1h, tag "competicoes-wca"). A data de início entra na
 * chave do cache: na virada do dia, competições passadas saem da lista.
 * Para forçar atualização: POST /api/revalidate { "tags": ["competicoes-wca"] }.
 */
export async function getCompetitionsByRegion(): Promise<CompetitionsByRegion> {
  const start = todaySaoPaulo();
  return unstable_cache(() => fetchCompetitionsByRegion(start), ["competicoes-wca", start], {
    revalidate: REVALIDATE_SECONDS,
    tags: [COMPETICOES_TAG],
  })();
}
