/** Formato dos dados gerados por scripts/rankings/build-rankings.mjs. */

export interface Champion {
  wcaId: string;
  name: string;
  points: number;
  /** Miniatura da foto na WCA (null = sem foto). */
  avatar: string | null;
}

export interface ChampionEntry {
  year: number;
  /** Ano em andamento: é o líder, ainda não o campeão. */
  partial: boolean;
  /** Mais de um em caso de empate. */
  champions: Champion[];
}

export interface RankingsIndex {
  version: string;
  updatedAt: string; // YYYY-MM-DD
  firstYear: number;
  currentYear: number;
  years: { year: number; competitions: number; competitors: number }[];
  champions: {
    overall: ChampionEntry[];
    byEvent: Record<string, ChampionEntry[]>;
  };
}

/** [wcaId, nome, total, nº de competições, { modalidade: pontos }] */
export type PersonRow = [string, string, number, number, Record<string, number>];

export interface YearFile {
  year: number;
  partial: boolean;
  competitions: { id: string; name: string; date: string; city: string }[];
  events: string[];
  people: PersonRow[];
}

export interface RankedRow {
  rank: number;
  wcaId: string;
  name: string;
  points: number;
  comps: number;
}

export const wcaProfileUrl = (wcaId: string) => `https://www.worldcubeassociation.org/persons/${wcaId}`;

/** Classificação com empates (1, 2, 2, 4…). Espera a lista já ordenada. */
export function rank<T extends { points: number }>(sorted: T[]): (T & { rank: number })[] {
  let last: number | null = null;
  let r = 0;
  return sorted.map((x, i) => {
    if (x.points !== last) {
      r = i + 1;
      last = x.points;
    }
    return { ...x, rank: r };
  });
}
