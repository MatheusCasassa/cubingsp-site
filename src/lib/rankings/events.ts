/**
 * Modalidades da WCA (ordem oficial), incluindo as descontinuadas que
 * aparecem nas competições paulistas antigas.
 */
type Names = { pt: string; en: string; es: string };

const EVENTS: { id: string; names: Names; discontinued?: boolean }[] = [
  { id: "333", names: { pt: "3x3x3", en: "3x3x3 Cube", es: "3x3x3" } },
  { id: "222", names: { pt: "2x2x2", en: "2x2x2 Cube", es: "2x2x2" } },
  { id: "444", names: { pt: "4x4x4", en: "4x4x4 Cube", es: "4x4x4" } },
  { id: "555", names: { pt: "5x5x5", en: "5x5x5 Cube", es: "5x5x5" } },
  { id: "666", names: { pt: "6x6x6", en: "6x6x6 Cube", es: "6x6x6" } },
  { id: "777", names: { pt: "7x7x7", en: "7x7x7 Cube", es: "7x7x7" } },
  { id: "333bf", names: { pt: "3x3x3 às Cegas", en: "3x3x3 Blindfolded", es: "3x3x3 a Ciegas" } },
  { id: "333fm", names: { pt: "3x3x3 Menos Movimentos", en: "3x3x3 Fewest Moves", es: "3x3x3 Menos Movimientos" } },
  { id: "333oh", names: { pt: "3x3x3 com Uma Mão", en: "3x3x3 One-Handed", es: "3x3x3 a Una Mano" } },
  { id: "clock", names: { pt: "Clock", en: "Clock", es: "Clock" } },
  { id: "minx", names: { pt: "Megaminx", en: "Megaminx", es: "Megaminx" } },
  { id: "pyram", names: { pt: "Pyraminx", en: "Pyraminx", es: "Pyraminx" } },
  { id: "skewb", names: { pt: "Skewb", en: "Skewb", es: "Skewb" } },
  { id: "sq1", names: { pt: "Square-1", en: "Square-1", es: "Square-1" } },
  { id: "444bf", names: { pt: "4x4x4 às Cegas", en: "4x4x4 Blindfolded", es: "4x4x4 a Ciegas" } },
  { id: "555bf", names: { pt: "5x5x5 às Cegas", en: "5x5x5 Blindfolded", es: "5x5x5 a Ciegas" } },
  { id: "333mbf", names: { pt: "3x3x3 Múltiplos às Cegas", en: "3x3x3 Multi-Blind", es: "3x3x3 Múltiples a Ciegas" } },
  { id: "333ft", names: { pt: "3x3x3 com os Pés", en: "3x3x3 With Feet", es: "3x3x3 con los Pies" }, discontinued: true },
  { id: "magic", names: { pt: "Magic", en: "Magic", es: "Magic" }, discontinued: true },
  { id: "mmagic", names: { pt: "Master Magic", en: "Master Magic", es: "Master Magic" }, discontinued: true },
  {
    id: "333mbo",
    names: { pt: "3x3x3 Múltiplos às Cegas (antigo)", en: "3x3x3 Multi-Blind Old Style", es: "3x3x3 Múltiples a Ciegas (antiguo)" },
    discontinued: true,
  },
];

const ORDER = new Map(EVENTS.map((e, i) => [e.id, i]));
const BY_ID = new Map(EVENTS.map((e) => [e.id, e]));

export function eventName(id: string, locale: string): string {
  const e = BY_ID.get(id);
  if (!e) return id;
  return e.names[(locale as keyof Names) in e.names ? (locale as keyof Names) : "pt"];
}

export function isDiscontinued(id: string): boolean {
  return !!BY_ID.get(id)?.discontinued;
}

/** Ordena ids de modalidade na ordem oficial da WCA. */
export function sortEvents(ids: string[]): string[] {
  return [...ids].sort((a, b) => (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99));
}
