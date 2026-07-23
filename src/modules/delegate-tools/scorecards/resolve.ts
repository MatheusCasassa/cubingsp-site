import type {
  WcifCompetition,
  WcifRound,
  WcifActivity,
  ScorecardData,
  RoundScorecards,
} from "./types";
import { attemptsForFormat, cutoffAfterForAttempts, eventNamePt } from "./format";

/**
 * Resolve os dados de súmulas de uma rodada a partir do WCIF.
 *
 * Grupos: lidos das atividades-filhas do cronograma ('333-r1-g2') via
 * assignments de cada competidor (assignmentCode 'competitor'). Se a
 * competição não tiver grupos atribuídos (ex: não usou Groupifier),
 * todos caem no grupo '' (em branco para preencher à mão).
 *
 * Rodadas 2+: os classificados só são conhecidos durante o campeonato,
 * então geramos súmulas EM BRANCO (quantidade = advancementCondition ou
 * informada pelo usuário) — padrão também usado pelas ferramentas da WCA.
 */
export function resolveRound(
  wcif: WcifCompetition,
  roundId: string,
  opts: { blankCount?: number } = {}
): RoundScorecards {
  const [eventId, roundPart] = roundId.split("-r");
  const roundNumber = parseInt(roundPart, 10);
  const event = wcif.events.find((e) => e.id === eventId);
  const round = event?.rounds.find((r) => r.id === roundId);
  if (!event || !round) throw new Error(`Rodada não encontrada: ${roundId}`);

  const base = roundBase(wcif, round, eventId, roundNumber);

  // Rodadas 2+ → súmulas em branco
  if (roundNumber > 1) {
    const count = opts.blankCount ?? 0;
    const cards = Array.from({ length: count }, () => ({
      ...base,
      competitorId: null,
      competitorName: null,
      group: "",
    }));
    return { roundId, eventName: base.eventName, roundNumber, cards };
  }

  // Mapa activityId → número do grupo desta rodada
  const groupByActivity = new Map<number, string>();
  for (const venue of wcif.schedule?.venues ?? []) {
    for (const room of venue.rooms) {
      for (const act of room.activities) {
        collectGroups(act, roundId, groupByActivity);
      }
    }
  }

  const cards: ScorecardData[] = [];
  for (const person of wcif.persons) {
    if (person.registration?.status !== "accepted") continue;
    if (!person.registration.eventIds.includes(eventId)) continue;

    let group = "";
    for (const a of person.assignments ?? []) {
      if (a.assignmentCode === "competitor" && groupByActivity.has(a.activityId)) {
        group = groupByActivity.get(a.activityId)!;
        break;
      }
    }

    cards.push({
      ...base,
      competitorId: person.registrantId,
      competitorName: person.name,
      group,
    });
  }

  // Ordena por grupo e nome (súmulas saem prontas para distribuir)
  cards.sort((a, b) => {
    const g = (a.group || "9999").localeCompare(b.group || "9999", undefined, { numeric: true });
    if (g !== 0) return g;
    return (a.competitorName ?? "").localeCompare(b.competitorName ?? "");
  });

  return { roundId, eventName: base.eventName, roundNumber, cards };
}

function roundBase(
  wcif: WcifCompetition,
  round: WcifRound,
  eventId: string,
  roundNumber: number
): Omit<ScorecardData, "competitorId" | "competitorName" | "group"> {
  const attempts = attemptsForFormat(round.format);

  let timeLimit: ScorecardData["timeLimit"] = { kind: "none" };
  if (round.timeLimit) {
    timeLimit =
      round.timeLimit.cumulativeRoundIds.length > 0
        ? { kind: "cumulative", centiseconds: round.timeLimit.centiseconds }
        : { kind: "single", centiseconds: round.timeLimit.centiseconds };
  }

  return {
    competitionName: wcif.shortName || wcif.name,
    eventName: eventNamePt(eventId),
    roundNumber,
    attempts,
    cutoffAfter: cutoffAfterForAttempts(attempts),
    timeLimit,
    cutoff: round.cutoff ? { centiseconds: round.cutoff.attemptResult } : null,
  };
}

function collectGroups(
  act: WcifActivity,
  roundId: string,
  out: Map<number, string>
) {
  if (act.activityCode.startsWith(`${roundId}-g`)) {
    out.set(act.id, act.activityCode.split("-g")[1]);
  }
  for (const child of act.childActivities ?? []) {
    collectGroups(child, roundId, out);
  }
}
