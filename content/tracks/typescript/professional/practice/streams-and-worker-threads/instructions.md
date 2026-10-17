`toSummaries` and `totalClimb` are complete; keep them and `ClimbResult` as they are. The tests
feed `lines` chunks cut in awkward places, stream files of their own through `summarizeRides`,
write to a slow stream whose buffer they watch, and check which thread did the climbing. Every
wait is on an event, never on a timer.

1. **`lines(source)`** is an async generator: it reads chunks (`Buffer` or `string`) and yields
   each line without its `"\n"`. A chunk may end in the middle of a line, so keep the piece
   after the last newline and put it in front of the next chunk. After the last chunk, yield
   what is left unless it is empty. So the chunks `"a\n\nb"`, `"c\n"` give `"a"`, `""`, `"bc"`.
2. **`summarizeRides(inputPath: string, outputPath: string): Promise<void>`** streams the file
   at `inputPath` through `lines` and `toSummaries` into the file at `outputPath`, with
   `pipeline` from `node:stream/promises`, and settles when the pipeline does. A missing input
   file makes it reject.
3. **`writeAll(stream: Writable, items: Iterable<unknown>): Promise<number>`** writes the items
   in order. Whenever `write()` returns `false`, wait for the stream's `"drain"` event before
   writing the next item. Resolve with the number of times you waited. Do not end the stream.
4. **`climbInWorker(elevations: readonly number[]): Promise<ClimbResult>`** runs `totalClimb` in
   a new `Worker` started from this same file, `new Worker(new URL(import.meta.url), { workerData })`,
   with `workerData` holding the elevations and a marker such as `task: "climb"`. At the top
   level of the file, when `isMainThread` is `false` and `workerData` carries your marker,
   compute the climb and post `{ climb, threadId }` with `parentPort`. `climbInWorker` resolves
   with that message (`once(worker, "message")`); if the worker throws, it rejects.

Example:

```ts
for await (const line of lines(Readable.from(["Ana,42,9", "0\nBo,30,60\n", "Cy,10,30"]))) console.log(line);
// Ana,42,90
// Bo,30,60
// Cy,10,30

// rides.csv holds "rider,km,minutes\nAna,42,90\nBo,30,60\n"
await summarizeRides("rides.csv", "speeds.txt");   // speeds.txt: "Ana 28.0 km/h\nBo 30.0 km/h\n"

const sink = new Writable({ objectMode: true, highWaterMark: 3, write(_item, _encoding, done) { setImmediate(done); } });
await writeAll(sink, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);   // 3: write() returned false at 3, 6 and 9

await climbInWorker([120, 180, 150, 210])   // { climb: 120, threadId: 1 } (or another id, never 0)
```

**Tip:** the test imports your file on the main thread, where the worker's branch must not run;
the worker loads the same file, where it must. `workerData` arrives as `any`, so check the
marker before using it.
