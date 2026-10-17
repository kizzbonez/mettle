import { once } from "node:events";
import { Writable } from "node:stream";
import { writeAll } from "./solution.js";

// A slow sink that finishes each item on a later turn of the event loop, and records how full
// its buffer was.
function slowSink(highWaterMark: number): { sink: Writable; received: unknown[]; maxBuffered: () => number } {
  const received: unknown[] = [];
  let most = 0;
  const sink = new Writable({
    objectMode: true,
    highWaterMark,
    write(item, _encoding, done) {
      received.push(item);
      most = Math.max(most, sink.writableLength);
      setImmediate(done);
    },
  });
  return { sink, received, maxBuffered: () => most };
}

const three = slowSink(3);
const waits = await writeAll(three.sink, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
three.sink.end();
await once(three.sink, "finish");
check.equal(three.received, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], "every item arrives, in order");
check.equal(waits, 3, "writeAll waits each time write() returns false");
check.true(three.maxBuffered() <= 3, "the buffer never holds more than the high water mark");

// A long stream of readings from a generator: memory stays flat.
function* readings(count: number): Generator<{ n: number }> {
  for (let n = 1; n <= count; n++) yield { n };
}
const sixteen = slowSink(16);
const longWaits = await writeAll(sixteen.sink, readings(20_000));
sixteen.sink.end();
await once(sixteen.sink, "finish");
check.equal(sixteen.received.length, 20_000, "all 20,000 readings arrive");
check.equal((sixteen.received[19_999] as { n: number }).n, 20_000, "the last reading arrives last");
check.equal(longWaits, 1250, "the number of waits for 20,000 readings with a high water mark of 16");
check.true(sixteen.maxBuffered() <= 16, "the buffer stays at its high water mark");

// When write() never says stop, there is nothing to wait for.
const roomy = slowSink(100);
check.equal(await writeAll(roomy.sink, ["a", "b", "c"]), 0, "no waits when the buffer never fills");
check.equal(await writeAll(roomy.sink, []), 0, "no items, no waits");
check.true(roomy.sink.writable, "writeAll does not end the stream");
roomy.sink.end();
await once(roomy.sink, "finish");
check.equal(roomy.received, ["a", "b", "c"], "the items written to a roomy sink");
