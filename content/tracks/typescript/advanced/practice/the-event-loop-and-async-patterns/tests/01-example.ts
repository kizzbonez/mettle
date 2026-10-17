// The example from the instructions.
import { bundles, washAll } from "./solution.js";

let running = 0;
let peak = 0;
const results = await washAll(["towels", "jeans", "sheets"], 2, async (load) => {
  running++;
  peak = Math.max(peak, running);
  await new Promise<void>((resolve) => setImmediate(resolve));
  running--;
  return `${load} clean`;
});
check.equal(results, ["towels clean", "jeans clean", "sheets clean"], "washAll resolves with every result in load order");
check.equal(peak, 2, "two machines run two washes at once, and no more");

async function* foldingTable(): AsyncGenerator<string> {
  yield "shirt";
  yield "sock";
  yield "scarf";
  yield "sock";
  yield "cap";
}
const bags: string[][] = [];
for await (const bag of bundles(foldingTable(), 2)) bags.push(bag);
check.equal(bags, [["shirt", "sock"], ["scarf", "sock"], ["cap"]], "bundles packs the garments two at a time, the last bag holding what is left");
