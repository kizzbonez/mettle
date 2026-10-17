// The example from the instructions, with branches that answer at once.
import { firstWithCopy, shelfReport, totalCopies, withDeadline, type Branch } from "./solution.js";

function branch(name: string, copies: number | "offline"): Branch {
  return {
    name,
    async copiesOf(): Promise<number> {
      if (copies === "offline") {
        throw new Error(`${name} is offline`);
      }
      return copies;
    },
  };
}

const central = branch("Central", 4);
const harbour = branch("Harbour", 0);
const hillside = branch("Hillside", "offline");

check.equal(await totalCopies([central, harbour], "Dune"), 4, "totalCopies at Central and Harbour");
await check.rejects(() => totalCopies([central, hillside], "Dune"), "totalCopies rejects when Hillside is offline");
check.equal(
  await shelfReport([central, harbour, hillside], "Dune"),
  ["Central: 4", "Harbour: 0", "Hillside: offline"],
  "shelfReport of the three branches",
);
check.equal(await firstWithCopy([harbour, hillside, central], "Dune"), "Central", "the first branch with a copy");
check.equal(await withDeadline(central.copiesOf("Dune"), new Promise(() => {})), 4, "withDeadline with a deadline that never comes");
