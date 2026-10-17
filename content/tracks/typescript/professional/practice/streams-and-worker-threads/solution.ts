// Cycling Club Ride Logs
//
// Turns ride logs into summaries with a stream pipeline, writes with backpressure, and moves a
// CPU-heavy calculation to a worker thread.
import { once } from "node:events";
import { createReadStream, createWriteStream } from "node:fs";
import type { Writable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Worker, isMainThread, parentPort, threadId, workerData } from "node:worker_threads";

// Complete: one "rider,km,minutes" line in, one "rider 28.0 km/h" line out. The header,
// empty lines and rows that do not make sense are skipped.
export async function* toSummaries(source: AsyncIterable<string>): AsyncGenerator<string> {
  for await (const line of source) {
    const [rider, km, minutes] = line.split(",");
    const distance = Number(km);
    const time = Number(minutes);
    if (!rider || rider === "rider" || !Number.isFinite(distance) || !(time > 0)) continue;
    yield `${rider} ${(distance / (time / 60)).toFixed(1)} km/h\n`;
  }
}

// Complete: the metres climbed along an elevation profile (the sum of every rise).
export function totalClimb(elevations: readonly number[]): number {
  let climb = 0;
  for (let i = 1; i < elevations.length; i++) {
    if (!Number.isFinite(elevations[i]) || !Number.isFinite(elevations[i - 1])) {
      throw new RangeError(`elevation ${i} is not a number`);
    }
    if (elevations[i] > elevations[i - 1]) climb += elevations[i] - elevations[i - 1];
  }
  return climb;
}

export async function* lines(source: AsyncIterable<Buffer | string>): AsyncGenerator<string> {
  let rest = "";
  for await (const chunk of source) {
    const parts = (rest + chunk.toString()).split("\n");
    rest = parts.pop() ?? ""; // a chunk may end in the middle of a line
    yield* parts;
  }
  if (rest !== "") yield rest;
}

export async function summarizeRides(inputPath: string, outputPath: string): Promise<void> {
  await pipeline(createReadStream(inputPath), lines, toSummaries, createWriteStream(outputPath));
}

export async function writeAll(stream: Writable, items: Iterable<unknown>): Promise<number> {
  let waits = 0;
  for (const item of items) {
    if (!stream.write(item)) {
      waits += 1;
      await once(stream, "drain");
    }
  }
  return waits;
}

export interface ClimbResult {
  readonly climb: number;
  readonly threadId: number;
}

export async function climbInWorker(elevations: readonly number[]): Promise<ClimbResult> {
  const worker = new Worker(new URL(import.meta.url), { workerData: { task: "climb", elevations } });
  const [result] = (await once(worker, "message")) as [ClimbResult];
  return result;
}

// The worker's side: this file, loaded again inside the worker thread.
if (!isMainThread && workerData?.task === "climb") {
  parentPort?.postMessage({ climb: totalClimb(workerData.elevations as number[]), threadId });
}
