import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { RoundScorecards, ScorecardData } from "./types";
import { formatCentis } from "./format";

/**
 * Gerador de PDF de súmulas — 4 por página A4 (formato A6), com guias
 * de corte. Roda 100% no navegador (pdf-lib), sem custo de servidor.
 * Layout baseado na súmula de referência da CubingSP.
 */

const A4 = { w: 595.28, h: 841.89 };
const QUAD = { w: A4.w / 2, h: A4.h / 2 };
const M = 18; // margem interna de cada súmula

const INK = rgb(0.1, 0.1, 0.12);
const GRAY = rgb(0.45, 0.45, 0.5);
const LIGHT = rgb(0.75, 0.75, 0.78);

interface Ctx {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  x0: number; // canto inferior-esquerdo do quadrante
  y0: number;
}

export async function generateScorecardsPdf(
  rounds: RoundScorecards[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const cards = rounds.flatMap((r) => r.cards);

  for (let i = 0; i < cards.length; i += 4) {
    const page = doc.addPage([A4.w, A4.h]);
    drawCutGuides(page);
    const quadrants: [number, number][] = [
      [0, QUAD.h], // superior esquerdo
      [QUAD.w, QUAD.h], // superior direito
      [0, 0], // inferior esquerdo
      [QUAD.w, 0], // inferior direito
    ];
    cards.slice(i, i + 4).forEach((card, j) => {
      const [x0, y0] = quadrants[j];
      drawScorecard({ page, font, bold, x0, y0 }, card);
    });
  }

  return doc.save();
}

function drawCutGuides(page: PDFPage) {
  page.drawLine({
    start: { x: QUAD.w, y: 6 },
    end: { x: QUAD.w, y: A4.h - 6 },
    thickness: 0.4,
    color: LIGHT,
    dashArray: [4, 4],
  });
  page.drawLine({
    start: { x: 6, y: QUAD.h },
    end: { x: A4.w - 6, y: QUAD.h },
    thickness: 0.4,
    color: LIGHT,
    dashArray: [4, 4],
  });
}

/* ── Primitivas ─────────────────────────────────────────────────── */

function box(
  ctx: Ctx,
  x: number,
  yTop: number,
  w: number,
  h: number,
  thickness = 0.8
) {
  ctx.page.drawRectangle({
    x: ctx.x0 + x,
    y: ctx.y0 + yTop - h,
    width: w,
    height: h,
    borderColor: INK,
    borderWidth: thickness,
  });
}

function text(
  ctx: Ctx,
  str: string,
  x: number,
  yBase: number,
  size: number,
  opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}
) {
  ctx.page.drawText(str, {
    x: ctx.x0 + x,
    y: ctx.y0 + yBase,
    size,
    font: opts.bold ? ctx.bold : ctx.font,
    color: opts.color ?? INK,
  });
}

function textCentered(
  ctx: Ctx,
  str: string,
  cx: number,
  yBase: number,
  size: number,
  opts: { bold?: boolean; color?: ReturnType<typeof rgb> } = {}
) {
  const f = opts.bold ? ctx.bold : ctx.font;
  const w = f.widthOfTextAtSize(str, size);
  text(ctx, str, cx - w / 2, yBase, size, opts);
}

/** Encolhe a fonte até o texto caber na largura fixa (nomes longos). */
function fitSize(font: PDFFont, str: string, maxWidth: number, start: number, min = 6.5): number {
  let size = start;
  while (size > min && font.widthOfTextAtSize(str, size) > maxWidth) size -= 0.5;
  return size;
}

/* ── Súmula ─────────────────────────────────────────────────────── */

function drawScorecard(ctx: Ctx, card: ScorecardData) {
  const W = QUAD.w - 2 * M; // largura útil
  const cx = M + W / 2;
  let y = QUAD.h - M; // cursor a partir do topo do quadrante

  /* Cabeçalho: [ID][Competição/Evento][Grupo] */
  const headH = 28;
  const idW = 34;
  const grW = 40;
  box(ctx, M, y, idW, headH);
  box(ctx, M + idW, y, W - idW - grW, headH);
  box(ctx, M + W - grW, y, grW, headH);

  text(ctx, "ID", M + 2.5, y - 7.5, 5, { color: GRAY });
  if (card.competitorId != null) {
    textCentered(ctx, String(card.competitorId), M + idW / 2, y - headH + 8, 11, { bold: true });
  }
  text(ctx, "Grupo", M + W - grW + 2.5, y - 7.5, 5, { color: GRAY });
  if (card.group) {
    textCentered(ctx, card.group, M + W - grW / 2, y - headH + 8, 11, { bold: true });
  }

  // Nome da competição (negrito, pequeno) + evento (sem formatação, pequeno)
  const midCx = M + idW + (W - idW - grW) / 2;
  const midW = W - idW - grW - 8;
  const compSize = fitSize(ctx.bold, card.competitionName, midW, 7);
  textCentered(ctx, card.competitionName, midCx, y - 10.5, compSize, { bold: true });
  const evLabel =
    card.roundNumber > 1 ? `${card.eventName} — Rodada ${card.roundNumber}` : card.eventName;
  textCentered(ctx, evLabel, midCx, y - 20.5, fitSize(ctx.font, evLabel, midW, 7));

  y -= headH + 17;

  /* Nome do competidor — contêiner de largura fixa (W), fonte ajustável */
  if (card.competitorName) {
    const nameSize = fitSize(ctx.bold, card.competitorName, W - 4, 12.5);
    textCentered(ctx, card.competitorName, cx, y, nameSize, { bold: true });
  } else {
    // Súmula em branco: linha para escrever o nome
    ctx.page.drawLine({
      start: { x: ctx.x0 + M + 20, y: ctx.y0 + y - 2 },
      end: { x: ctx.x0 + M + W - 20, y: ctx.y0 + y - 2 },
      thickness: 0.6,
      color: GRAY,
    });
  }
  y -= 13;

  /* Textos de configuração */
  const cfg: string[] = [];
  if (card.timeLimit.kind === "single") {
    cfg.push(`DNF se > ${formatCentis(card.timeLimit.centiseconds)}`);
  } else if (card.timeLimit.kind === "cumulative") {
    cfg.push(`Tempo cumulativo de ${formatCentis(card.timeLimit.centiseconds)}`);
  }
  cfg.push("Ex. Penalidade: 14.67 + 2 = 16.67");
  for (const line of cfg) {
    textCentered(ctx, line, cx, y, 6.5, { color: GRAY });
    y -= 8.5;
  }
  y -= 2;

  /* Colunas */
  const colNum = 15; // #
  const colSig = 24; // S, J, C, D
  const rowH = 27;

  // Cabeçalho de colunas (# S ... J C)
  const timeW = (extra: boolean) => W - colNum - colSig * (extra ? 4 : 3);
  text(ctx, "#", M + colNum / 2 - 2, y - 6, 6, { color: GRAY });
  text(ctx, "S", M + colNum + colSig / 2 - 2, y - 6, 6, { color: GRAY });
  const jx = M + colNum + colSig + timeW(false);
  text(ctx, "J", jx + colSig / 2 - 2, y - 6, 6, { color: GRAY });
  text(ctx, "C", jx + colSig + colSig / 2 - 2, y - 6, 6, { color: GRAY });
  y -= 9;

  const drawRow = (label: string, extra: boolean) => {
    const tW = timeW(extra);
    let x = M;
    box(ctx, x, y, colNum, rowH); // #
    textCentered(ctx, label, x + colNum / 2, y - rowH / 2 - 3, 8, { bold: true });
    x += colNum;
    box(ctx, x, y, colSig, rowH); // S
    x += colSig;
    box(ctx, x, y, tW, rowH); // tempo
    x += tW;
    box(ctx, x, y, colSig, rowH); // J
    x += colSig;
    box(ctx, x, y, colSig, rowH); // C
    x += colSig;
    if (extra) {
      box(ctx, x, y, colSig, rowH); // D (Delegado)
      text(ctx, "D", x + 2.5, y - 7, 5, { color: GRAY });
    }
    y -= rowH;
  };

  /* Bloco 1 */
  for (let i = 1; i <= card.cutoffAfter; i++) drawRow(String(i), false);

  /* Texto intermediário 1 — tempo de corte */
  y -= 3;
  const cutText = card.cutoff
    ? `Tempo de corte se > ${formatCentis(card.cutoff.centiseconds)}`
    : "Não possui tempo de corte";
  textCentered(ctx, cutText, cx, y - 5, 6.5, { color: GRAY });
  y -= 13;

  /* Bloco 2 */
  for (let i = card.cutoffAfter + 1; i <= card.attempts; i++) drawRow(String(i), false);

  /* Extra(s) */
  y -= 3;
  textCentered(ctx, "Extra(s)", cx, y - 5, 6.5, { color: GRAY });
  y -= 13;
  drawRow("E1", true);
  drawRow("E2", true);
}
