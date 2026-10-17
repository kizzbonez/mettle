// Bird Count
//
// Write the five functions. The signatures are complete: replace each
// `throw new Error("Not implemented")` with your code.

// Task 1: count each species with a Map, keys in the order first seen.
export function tally(sightings: readonly string[]): Map<string, number> {
  throw new Error("Not implemented");
}

// Task 2: the species seen on this walk that are not on the year list yet (a set method).
export function newForTheYear(yearList: ReadonlySet<string>, walk: Iterable<string>): Set<string> {
  throw new Error("Not implemented");
}

// Task 3: the species seen on every one of the walks (another set method).
export function seenOnEveryWalk(walks: readonly ReadonlySet<string>[]): Set<string> {
  throw new Error("Not implemented");
}

// Task 4: an endless generator of ring numbers.
export function* ringNumbers(prefix: string, first: number): Generator<string> {
  throw new Error("Not implemented");
}

// Task 5: iterator helpers on counts.entries().
export function rareSpecies(counts: ReadonlyMap<string, number>, limit: number): string[] {
  throw new Error("Not implemented");
}
