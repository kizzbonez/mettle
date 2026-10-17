// Metronome Module
//
// data/metronome.mjs is plain JavaScript with no types. Read it, then declare its shape below,
// the way a .d.ts file would: types and signatures only, no bodies.

// Tasks 1 to 3: fill in these three interfaces.
export interface Pattern {}

export interface RenderSymbols {}

export interface MetronomeModule {}

// Loads the JavaScript module while the program runs. An import() whose path is computed at run
// time gives `any`, just like an untyped package: the compiler knows nothing about the module
// until the annotation on `metronome` tells it, and from then on it believes that annotation
// completely. (The compiled file runs from out/, so the path goes up one folder to data/.)
const loaded = await import(new URL("../data/metronome.mjs", import.meta.url).href);
export const metronome: MetronomeModule = loaded;

// Task 4
export function barDisplay(name: string, bpm: number): string {
  throw new Error("Not implemented");
}
