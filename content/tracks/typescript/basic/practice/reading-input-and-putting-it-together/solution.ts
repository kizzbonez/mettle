import { readFileSync } from "node:fs";

// The temperature log of a restaurant's walk-in fridge.

export interface Reading {
  time: string;
  celsius: number;
}

export function parseReading(line: string): Reading | string {
  const fields = line.split(",");
  if (fields.length !== 2) {
    return `expected "time,celsius" but found ${fields.length} field(s)`;
  }
  const time = fields[0].trim();
  const celsiusText = fields[1].trim();
  if (time.length !== 5 || time[2] !== ":") {
    return `"${time}" is not a time like 07:30`;
  }
  const celsius = Number(celsiusText);
  if (celsiusText === "" || Number.isNaN(celsius)) {
    return `"${celsiusText}" is not a temperature`;
  }
  return { time, celsius };
}

export function parseLimit(text: string | undefined): number | undefined {
  if (text === undefined) {
    return 5;
  }
  const limit = Number(text);
  if (text.trim() === "" || Number.isNaN(limit)) {
    return undefined;
  }
  return limit;
}

export function tooWarm(readings: readonly Reading[], limit: number): Reading[] {
  return readings.filter((reading) => reading.celsius > limit);
}

function main(): void {
  const limitText = process.argv.at(2);
  const limit = parseLimit(limitText);
  if (limit === undefined) {
    console.error(`the limit must be a number, got "${limitText}"`);
    process.exitCode = 2;
    return;
  }

  const lines = readFileSync(0, "utf8").split("\n");
  const readings: Reading[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const result = parseReading(line);
    if (typeof result === "string") {
      console.error(`line ${i + 1}: ${result}`);
      process.exitCode = 1;
    } else {
      readings.push(result);
    }
  }

  const warm = tooWarm(readings, limit);
  console.log(`${readings.length} readings, ${warm.length} above ${limit} C`);
  for (const reading of warm) {
    console.log(`too warm at ${reading.time}: ${reading.celsius} C`);
  }
}

if (import.meta.main) {
  main();
}
