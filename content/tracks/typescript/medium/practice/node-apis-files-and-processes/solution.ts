import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

export async function readJournal(file: string): Promise<string[]> {
  try {
    const text = await readFile(file, "utf8");
    return text.split("\n").filter((line) => line.trim() !== "");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function saveSchedule(file: string, schedule: Record<string, number>): Promise<void> {
  const temporary = `${file}.tmp`;
  await writeFile(temporary, `${JSON.stringify(schedule, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

export function intervalDays(env: NodeJS.ProcessEnv): number {
  const text = env.WATER_EVERY ?? "7";
  const days = Number(text);
  if (!Number.isInteger(days) || days < 1 || days > 60) {
    throw new RangeError(`WATER_EVERY must be a whole number from 1 to 60, got "${text}"`);
  }
  return days;
}

async function main(args: string[]): Promise<void> {
  if (args.length !== 3) {
    console.error("usage: node solution.js <journal> <plant> <YYYY-MM-DD>");
    process.exitCode = 2;
    return;
  }
  let days: number;
  try {
    days = intervalDays(process.env);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
    return;
  }
  const [journal, plant, day] = args;
  await mkdir(path.dirname(journal), { recursive: true });
  await appendFile(journal, `${day} ${plant}\n`, "utf8");
  const entries = await readJournal(journal);
  console.log(`${plant} watered, entry ${entries.length}, next in ${days} days`);
}

if (import.meta.main) {
  await main(process.argv.slice(2));
}
