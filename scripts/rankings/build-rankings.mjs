#!/usr/bin/env node
/**
 * Gera os dados do Ranking Estadual (método APS, o mesmo do RASCS).
 *
 *   node scripts/rankings/build-rankings.mjs
 *
 * 1. Lista as competições oficiais da WCA no estado de São Paulo desde 2007
 *    (sede única com cidade "…, São Paulo"; competições com várias sedes ficam
 *    de fora, porque o resultado não diz em qual sede a pessoa competiu).
 * 2. Em cada rodada, cada competidor ganha  Pt = TC / (P + 1)
 *    (TC = competidores na rodada, P = posição). Soma de todas as rodadas de
 *    todas as competições do ano = pontuação no ranking geral; a soma só das
 *    rodadas de uma modalidade = pontuação na modalidade.
 * 3. Grava:
 *    - public/data/rankings/<ano>.json  (ranking completo do ano, baixado pelo
 *      navegador só quando a pessoa escolhe o ano — arquivo estático, grátis)
 *    - src/data/rankings/index.json     (anos, campeões com foto da WCA)
 *
 * Roda pela GitHub Action semanal (.github/workflows/rankings.yml) ou à mão.
 * Sem dependências: Node 20+ (fetch nativo).
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUBLIC_DIR = join(ROOT, "public", "data", "rankings");
const INDEX_FILE = join(ROOT, "src", "data", "rankings", "index.json");

const WCA = "https://www.worldcubeassociation.org/api/v0";
const UA = "CubingSP-site-rankings/1.0 (+https://github.com/MatheusCasassa/cubingsp-site)";
const FIRST_YEAR = 2007;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Data de hoje em São Paulo (YYYY-MM-DD). */
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const currentYear = Number(today.slice(0, 4));

async function wca(path, { tries = 5 } = {}) {
  for (let i = 1; ; i++) {
    const res = await fetch(`${WCA}${path}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
    if (res.ok) return res.json();
    if (i >= tries || (res.status < 500 && res.status !== 429)) {
      throw new Error(`WCA ${res.status} em ${path}`);
    }
    const wait = Number(res.headers.get("retry-after")) || 5 * i;
    console.warn(`  WCA ${res.status} em ${path}; nova tentativa em ${wait}s`);
    await sleep(wait * 1000);
  }
}

const round2 = (x) => Math.round(x * 100) / 100;

/** Competições paulistas (sede única), não canceladas, já encerradas. */
async function listSpCompetitions() {
  const all = [];
  for (let page = 1; page <= 50; page++) {
    const batch = await wca(
      `/competitions?country_iso2=BR&start=${FIRST_YEAR}-01-01&end=${today}&sort=start_date&per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100) break;
    await sleep(200);
  }
  const byId = new Map();
  for (const c of all) {
    if (c.cancelled_at) continue;
    if (!/, São Paulo$/.test(c.city)) continue; // "Campinas, São Paulo"
    if (c.end_date > today) continue;
    byId.set(c.id, c);
  }
  return [...byId.values()].sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id));
}

/** Pontos de cada resultado de uma competição (por rodada). */
function scoreCompetition(results) {
  const tc = new Map(); // round_id → total de competidores
  for (const r of results) tc.set(r.round_id, (tc.get(r.round_id) ?? 0) + 1);
  return results
    .filter((r) => r.pos != null && r.wca_id)
    .map((r) => ({
      wcaId: r.wca_id,
      name: r.name,
      eventId: r.event_id,
      points: tc.get(r.round_id) / (r.pos + 1),
    }));
}

/** Classificação com empates (1, 2, 2, 4…), comparando com 2 casas. */
function withRanks(sorted, key) {
  let last = null;
  let rank = 0;
  return sorted.map((x, i) => {
    const v = round2(key(x));
    if (v !== last) {
      rank = i + 1;
      last = v;
    }
    return { ...x, rank };
  });
}

async function avatars(wcaIds) {
  const out = {};
  const ids = [...new Set(wcaIds)];
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const list = await wca(`/persons?wca_ids=${chunk.join(",")}&per_page=100`);
    for (const { person } of list) {
      const a = person?.avatar;
      out[person.wca_id] = a && !a.is_default ? a.thumb_url : null;
    }
    await sleep(300);
  }
  return out;
}

async function main() {
  console.log(`Ranking estadual — competições de SP de ${FIRST_YEAR} até ${today}`);
  const comps = await listSpCompetitions();
  console.log(`${comps.length} competições encerradas em SP`);

  /** ano → { comps, people: Map(wcaId → {name,total,events,comps:Set}) } */
  const years = new Map();
  for (const [i, c] of comps.entries()) {
    const results = await wca(`/competitions/${c.id}/results`);
    process.stdout.write(`  [${i + 1}/${comps.length}] ${c.id}: ${results.length} resultados\n`);
    await sleep(200);
    if (!results.length) continue; // resultados ainda não publicados

    const year = Number(c.start_date.slice(0, 4));
    if (!years.has(year)) years.set(year, { comps: [], people: new Map() });
    const y = years.get(year);
    y.comps.push({ id: c.id, name: c.name, date: c.start_date, city: c.city.replace(/, São Paulo$/, "") });

    for (const s of scoreCompetition(results)) {
      let p = y.people.get(s.wcaId);
      if (!p) y.people.set(s.wcaId, (p = { name: s.name, total: 0, events: {}, comps: new Set() }));
      p.name = s.name;
      p.total += s.points;
      p.events[s.eventId] = (p.events[s.eventId] ?? 0) + s.points;
      p.comps.add(c.id);
    }
  }

  await mkdir(PUBLIC_DIR, { recursive: true });
  await mkdir(dirname(INDEX_FILE), { recursive: true });

  const yearSummaries = [];
  const overall = []; // { year, partial, champions: [...] }
  const byEvent = {}; // eventId → [{ year, partial, champions }]
  const champIds = [];
  const fileHashes = [];

  for (const year of [...years.keys()].sort((a, b) => a - b)) {
    const y = years.get(year);
    const people = [...y.people.entries()].map(([wcaId, p]) => ({
      wcaId,
      name: p.name,
      total: round2(p.total),
      comps: p.comps.size,
      events: Object.fromEntries(Object.entries(p.events).map(([e, v]) => [e, round2(v)])),
    }));
    people.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt"));
    const eventIds = [...new Set(people.flatMap((p) => Object.keys(p.events)))];
    const partial = year === currentYear;

    // Campeões (empate no topo = mais de um campeão)
    const top = (list, key) => {
      const best = list.length ? round2(key(list[0])) : null;
      return list
        .filter((p) => round2(key(p)) === best)
        .map((p) => ({ wcaId: p.wcaId, name: p.name, points: round2(key(p)) }));
    };
    const champ = top(people, (p) => p.total);
    overall.push({ year, partial, champions: champ });
    champIds.push(...champ.map((c) => c.wcaId));
    for (const ev of eventIds) {
      const list = people
        .filter((p) => p.events[ev] != null)
        .sort((a, b) => b.events[ev] - a.events[ev] || a.name.localeCompare(b.name, "pt"));
      const ch = top(list, (p) => p.events[ev]);
      (byEvent[ev] ??= []).push({ year, partial, champions: ch });
      champIds.push(...ch.map((c) => c.wcaId));
    }

    // Arquivo do ano (compacto: [wcaId, nome, total, competições, {modalidade: pontos}])
    const ranked = withRanks(people, (p) => p.total);
    const file = {
      year,
      partial,
      competitions: y.comps,
      events: eventIds,
      people: ranked.map((p) => [p.wcaId, p.name, p.total, p.comps, p.events]),
    };
    const json = JSON.stringify(file);
    await writeFile(join(PUBLIC_DIR, `${year}.json`), json + "\n");
    fileHashes.push(`${year}:${createHash("sha1").update(json).digest("hex")}`);
    yearSummaries.push({ year, competitions: y.comps.length, competitors: people.length });
    console.log(`  ${year}: ${y.comps.length} competições, ${people.length} competidores, ${(json.length / 1024).toFixed(0)} KB`);
  }

  console.log(`Buscando fotos de ${new Set(champIds).size} campeões…`);
  const photo = await avatars(champIds);
  const addPhoto = (entry) => ({ ...entry, champions: entry.champions.map((c) => ({ ...c, avatar: photo[c.wcaId] ?? null })) });

  const data = {
    firstYear: FIRST_YEAR,
    currentYear,
    years: yearSummaries,
    champions: {
      overall: overall.map(addPhoto),
      byEvent: Object.fromEntries(Object.entries(byEvent).map(([ev, list]) => [ev, list.map(addPhoto)])),
    },
  };

  // `version` muda só quando algum dado muda (evita commit vazio da Action)
  const version = createHash("sha1")
    .update(JSON.stringify(data) + fileHashes.join("|"))
    .digest("hex")
    .slice(0, 12);
  let updatedAt = today;
  try {
    const prev = JSON.parse(await readFile(INDEX_FILE, "utf8"));
    if (prev.version === version) updatedAt = prev.updatedAt;
  } catch {
    /* primeira execução */
  }
  await writeFile(INDEX_FILE, JSON.stringify({ version, updatedAt, ...data }, null, 1) + "\n");
  console.log(`Pronto. versão ${version}, atualizado em ${updatedAt}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
