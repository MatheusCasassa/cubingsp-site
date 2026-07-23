/**
 * Tipos do WCIF (WCA Competition Interchange Format) — subconjunto
 * usado pela geração de súmulas — e tipos internos da ferramenta.
 * Ref: https://github.com/thewca/wcif/blob/master/specification.md
 */

export interface WcifCompetition {
  id: string;
  name: string;
  shortName: string;
  events: WcifEvent[];
  persons: WcifPerson[];
  schedule: WcifSchedule;
}

export interface WcifEvent {
  id: string; // '333', '444', '333bf', '333mbf', '333fm', ...
  rounds: WcifRound[];
}

export interface WcifRound {
  id: string; // '333-r1'
  format: "1" | "2" | "3" | "a" | "m";
  timeLimit: {
    centiseconds: number;
    cumulativeRoundIds: string[];
  } | null;
  cutoff: {
    numberOfAttempts: number;
    attemptResult: number; // centiseconds
  } | null;
}

export interface WcifPerson {
  registrantId: number;
  name: string;
  wcaId: string | null;
  registration: {
    status: "accepted" | "pending" | "deleted";
    eventIds: string[];
  } | null;
  assignments?: {
    activityId: number;
    assignmentCode: string; // 'competitor', 'staff-judge', ...
  }[];
}

export interface WcifSchedule {
  venues: {
    rooms: {
      activities: WcifActivity[];
    }[];
  }[];
}

export interface WcifActivity {
  id: number;
  activityCode: string; // '333-r1' ou '333-r1-g2'
  childActivities?: WcifActivity[];
}

/* ── Tipos internos ─────────────────────────────────────────────── */

/** Dados resolvidos de uma súmula individual. */
export interface ScorecardData {
  competitionName: string;
  eventName: string;
  roundNumber: number;
  competitorId: number | null; // registrantId (ID do crachá); null = em branco
  competitorName: string | null;
  group: string; // '1', '2'... ou '' quando desconhecido
  attempts: number; // 5, 3, 2 ou 1
  /** Índice (1-based) do último solve do 1º bloco (antes do corte). */
  cutoffAfter: number;
  /** Texto do limite: simples, cumulativo ou nenhum. */
  timeLimit:
    | { kind: "single"; centiseconds: number }
    | { kind: "cumulative"; centiseconds: number }
    | { kind: "none" };
  cutoff: { centiseconds: number } | null;
}

/** Uma rodada pronta para gerar (com competidores agrupados). */
export interface RoundScorecards {
  roundId: string;
  eventName: string;
  roundNumber: number;
  cards: ScorecardData[];
}
