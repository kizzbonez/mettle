export interface Pattern {
  name: string;
  beats: number;
  accents: boolean[];
}

export interface RenderSymbols {
  accent?: string;
  beat?: string;
}

export interface MetronomeModule {
  readonly VERSION: string;
  beatInterval(bpm: number): number;
  patternFor(name: string): Pattern | undefined;
  render(pattern: Pattern, symbols?: RenderSymbols): string;
}

const loaded = await import(new URL("../data/metronome.mjs", import.meta.url).href);
export const metronome: MetronomeModule = loaded;

export function barDisplay(name: string, bpm: number): string {
  const pattern = metronome.patternFor(name);
  if (pattern === undefined) {
    throw new Error(`unknown pattern: ${name}`);
  }
  const milliseconds = Math.round(metronome.beatInterval(bpm));
  return `${pattern.name} at ${bpm} bpm: ${metronome.render(pattern)} (${milliseconds} ms)`;
}
