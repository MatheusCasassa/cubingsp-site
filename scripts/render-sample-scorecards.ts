/**
 * Gera um PDF de amostra das súmulas com dados fictícios, cobrindo os
 * 4 casos da lógica dinâmica. Uso: npx tsx scripts/render-sample-scorecards.ts
 */
import { writeFileSync } from "node:fs";
import { generateScorecardsPdf } from "../src/modules/delegate-tools/scorecards/generate";
import type { ScorecardData } from "../src/modules/delegate-tools/scorecards/types";

const base = {
  competitionName: "CubingSP Open 2026",
  roundNumber: 1,
  group: "1",
};

const cards: ScorecardData[] = [
  // Caso padrão: Ao5 com corte e limite simples (3x3x3)
  {
    ...base,
    eventName: "Cubo 3x3x3",
    competitorId: 42,
    competitorName: "Matheus Casassa Viana",
    attempts: 5,
    cutoffAfter: 2,
    timeLimit: { kind: "single", centiseconds: 60000 }, // 10:00.00
    cutoff: { centiseconds: 4000 }, // 40.00
  },
  // Sem tempo de corte (final)
  {
    ...base,
    eventName: "Cubo 3x3x3",
    roundNumber: 3,
    competitorId: null,
    competitorName: null,
    group: "",
    attempts: 5,
    cutoffAfter: 2,
    timeLimit: { kind: "single", centiseconds: 60000 },
    cutoff: null,
  },
  // 3 solves com corte após a 1ª (6x6x6)
  {
    ...base,
    eventName: "Cubo 6x6x6",
    competitorId: 7,
    competitorName: "Guilherme Yukio Nakamura Hashimoto de Oliveira",
    attempts: 3,
    cutoffAfter: 1,
    timeLimit: { kind: "single", centiseconds: 24000 }, // 4:00.00
    cutoff: { centiseconds: 12000 }, // 2:00.00
  },
  // Limite cumulativo (3x3x3 Blindfolded)
  {
    ...base,
    eventName: "3x3x3 Olhos Vendados",
    competitorId: 123,
    competitorName: "Ana Beatriz Souza",
    attempts: 3,
    cutoffAfter: 1,
    timeLimit: { kind: "cumulative", centiseconds: 60000 },
    cutoff: null,
  },
];

generateScorecardsPdf([
  { roundId: "sample", eventName: "Amostra", roundNumber: 1, cards },
]).then((pdf) => {
  writeFileSync("/home/claude/sumulas-amostra.pdf", pdf);
  console.log("PDF salvo: /home/claude/sumulas-amostra.pdf");
});
