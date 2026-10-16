/**
 * Integração futura com a API oficial da WCA.
 * https://www.worldcubeassociation.org/api/v0
 *
 * Princípio: a WCA NUNCA é chamada no caminho da requisição do usuário.
 * Usamos o cache de fetch do Next (`next.revalidate`) para que cada
 * endpoint seja consultado no máximo 1x por período — independente
 * de quantos visitantes o site tenha.
 */

const WCA_API = "https://www.worldcubeassociation.org/api/v0";

export async function getWcaCompetition(competitionId: string) {
  const res = await fetch(`${WCA_API}/competitions/${competitionId}`, {
    // Cache de fetch: 1 chamada à WCA por hora, no máximo.
    next: { revalidate: 3600, tags: [`wca-comp:${competitionId}`] },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getWcaPerson(wcaId: string) {
  const res = await fetch(`${WCA_API}/persons/${wcaId}`, {
    next: { revalidate: 86400, tags: [`wca-person:${wcaId}`] },
  });
  if (!res.ok) return null;
  return res.json();
}

// As ferramentas de delegado (súmulas, grupos, staff) vivem no hub
// externo de ferramentas (repositório MatheusCasassa/CubingSPTools).
// Aqui fica só o que o site usa: dados públicos com cache de fetch.
