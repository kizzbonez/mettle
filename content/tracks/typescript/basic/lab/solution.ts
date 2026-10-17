import { readFileSync } from "node:fs";

export type Result = "flash" | "top" | "zone" | "miss";

export interface Attempt {
  climber: string;
  problem: number;
  result: Result;
}

export interface Standing {
  climber: string;
  points: number;
  tops: number;
}

export function points(result: Result): number {
  switch (result) {
    case "flash":
      return 25;
    case "top":
      return 20;
    case "zone":
      return 10;
    case "miss":
      return 0;
  }
}

export function parseResult(text: string): Result | undefined {
  const word = text.trim().toLowerCase();
  if (word === "flash" || word === "top" || word === "zone" || word === "miss") {
    return word;
  }
  return undefined;
}

export function parseProblem(text: string): number | undefined {
  const trimmed = text.trim();
  if (!trimmed.startsWith("P") && !trimmed.startsWith("p")) {
    return undefined;
  }
  const digits = trimmed.slice(1);
  if (digits === "") {
    return undefined;
  }
  for (const char of digits) {
    if (char < "0" || char > "9") {
      return undefined;
    }
  }
  const problem = Number(digits);
  return problem >= 1 && problem <= 99 ? problem : undefined;
}

export function parseLine(line: string): Attempt | string {
  const fields = line.trim().split(" ").filter((field) => field !== "");
  if (fields.length !== 3) {
    return `expected 3 fields, found ${fields.length}`;
  }
  const [name, problemText, resultText] = fields;
  const problem = parseProblem(problemText);
  if (problem === undefined) {
    return `unknown problem "${problemText}"`;
  }
  const result = parseResult(resultText);
  if (result === undefined) {
    return `unknown result "${resultText}"`;
  }
  return { climber: name.toLowerCase(), problem, result };
}

function isTop(result: Result): boolean {
  return result === "flash" || result === "top";
}

export function standings(attempts: readonly Attempt[]): Standing[] {
  const best: { [climberAndProblem: string]: Attempt } = {};
  for (const attempt of attempts) {
    const key = `${attempt.climber} ${attempt.problem}`;
    const current = best[key];
    if (current === undefined || points(attempt.result) > points(current.result)) {
      best[key] = attempt;
    }
  }

  const totals: { [climber: string]: Standing } = {};
  for (const attempt of Object.values(best)) {
    const standing = totals[attempt.climber] ?? { climber: attempt.climber, points: 0, tops: 0 };
    standing.points += points(attempt.result);
    if (isTop(attempt.result)) {
      standing.tops += 1;
    }
    totals[attempt.climber] = standing;
  }

  return Object.values(totals).toSorted((a, b) => {
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    if (a.tops !== b.tops) {
      return b.tops - a.tops;
    }
    return a.climber.localeCompare(b.climber);
  });
}

export function formatStanding(rank: number, standing: Standing): string {
  const unit = standing.tops === 1 ? "top" : "tops";
  return `${rank}. ${standing.climber} ${standing.points} (${standing.tops} ${unit})`;
}

function main(): void {
  const lines = readFileSync(0, "utf8").split("\n");
  const attempts: Attempt[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const parsed = parseLine(line);
    if (typeof parsed === "string") {
      console.error(`line ${i + 1}: ${parsed}`);
      process.exitCode = 1;
    } else {
      attempts.push(parsed);
    }
  }

  const table = standings(attempts);
  if (table.length === 0) {
    console.log("No attempts");
    return;
  }
  for (let i = 0; i < table.length; i++) {
    console.log(formatStanding(i + 1, table[i]));
  }
}

if (import.meta.main) {
  main();
}
