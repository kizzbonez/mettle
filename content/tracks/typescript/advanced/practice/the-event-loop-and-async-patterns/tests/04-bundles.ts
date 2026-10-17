// bundles: an async generator that pulls lazily, closes its source, and never yields an empty bundle.
import { bundles } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const events: string[] = [];
async function* garments(count: number): AsyncGenerator<string> {
  try {
    for (let n = 1; n <= count; n++) {
      await null;
      events.push(`folded ${n}`);
      yield `garment ${n}`;
    }
  } finally {
    events.push("table closed");
  }
}

async function collect<T>(source: AsyncIterable<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of source) items.push(item);
  return items;
}

check.equal(await collect(bundles(garments(6), 3)), [["garment 1", "garment 2", "garment 3"], ["garment 4", "garment 5", "garment 6"]], "an exact multiple gives full bundles and no empty one");
check.equal(await collect(bundles(garments(4), 3)), [["garment 1", "garment 2", "garment 3"], ["garment 4"]], "the last bundle holds what is left");
check.equal(await collect(bundles(garments(0), 3)), [], "an empty source gives no bundles");
check.equal(await collect(bundles(garments(2), 1)), [["garment 1"], ["garment 2"]], "a size of 1 gives one item per bundle");
check.equal(await collect(bundles(garments(2), 5)), [["garment 1", "garment 2"]], "a size larger than the source gives one small bundle");

events.length = 0;
const first: string[][] = [];
for await (const bag of bundles(garments(10), 2)) {
  first.push(bag);
  break;
}
check.equal(first, [["garment 1", "garment 2"]], "the first bundle arrives as soon as it is full");
check.equal(events.filter((event) => event.startsWith("folded")).length, 2, "no item is pulled beyond the bundle that was asked for");
check.equal(events.at(-1), "table closed", "leaving the loop early closes the source");

events.length = 0;
const fromArray = bundles(garments(3), 2);
const head = await fromArray.next();
check.equal(head, { value: ["garment 1", "garment 2"], done: false }, "next gives the first bundle");
check.equal(events, ["folded 1", "folded 2"], "asking for one bundle pulls exactly its items");

for (const size of [0, -2, 2.5]) {
  events.length = 0;
  await check.rejects(() => bundles(garments(3), size).next(), `a size of ${size} is refused with a RangeError`, RangeError);
  check.equal(events.filter((event) => event.startsWith("folded")).length, 0, `nothing is read with a size of ${size}`);
}

async function firstBundle<T>(source: AsyncIterable<T>): Promise<T | undefined> {
  for await (const item of source) return item;
  return undefined;
}
const typed = await firstBundle(bundles(garments(2), 2));
export type Cases = [Expect<Equal<typeof typed, string[] | undefined>>];
check.equal(typed, ["garment 1", "garment 2"], "a bundle is an array of the source's items");

export function misuse(): void {
  // @ts-expect-error the source must be async iterable
  bundles(42, 2);
}
