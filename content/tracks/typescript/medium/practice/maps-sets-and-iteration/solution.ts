export function tally(sightings: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const species of sightings) {
    counts.set(species, (counts.get(species) ?? 0) + 1);
  }
  return counts;
}

export function newForTheYear(yearList: ReadonlySet<string>, walk: Iterable<string>): Set<string> {
  return new Set(walk).difference(yearList);
}

export function seenOnEveryWalk(walks: readonly ReadonlySet<string>[]): Set<string> {
  if (walks.length === 0) {
    return new Set();
  }
  let common = new Set(walks[0]);
  for (const walk of walks.slice(1)) {
    common = common.intersection(walk);
  }
  return common;
}

export function* ringNumbers(prefix: string, first: number): Generator<string> {
  for (let n = first; ; n += 1) {
    yield `${prefix}-${String(n).padStart(4, "0")}`;
  }
}

export function rareSpecies(counts: ReadonlyMap<string, number>, limit: number): string[] {
  return counts
    .entries()
    .filter(([, count]) => count === 1)
    .map(([species]) => species)
    .take(limit)
    .toArray();
}
