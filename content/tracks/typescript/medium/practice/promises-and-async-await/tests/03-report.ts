// shelfReport asks every branch at once, keeps the branches' order whatever order the answers
// arrive in, and never rejects.
import { shelfReport, type Branch } from "./solution.js";

interface FakeBranch {
  branch: Branch;
  asked: string[];
  answer: (copies: number) => void;
  fail: (reason: Error) => void;
}

function fakeBranch(name: string): FakeBranch {
  const asked: string[] = [];
  const pending: PromiseWithResolvers<number>[] = [];
  return {
    branch: {
      name,
      copiesOf(title: string): Promise<number> {
        asked.push(title);
        const answer = Promise.withResolvers<number>();
        pending.push(answer);
        return answer.promise;
      },
    },
    asked,
    answer: (copies) => pending[pending.length - 1].resolve(copies),
    fail: (reason) => pending[pending.length - 1].reject(reason),
  };
}

const [central, harbour, hillside, quay] = ["Central", "Harbour", "Hillside", "Quay"].map(fakeBranch);
const report = shelfReport([central.branch, harbour.branch, hillside.branch, quay.branch], "Middlemarch");
check.equal(
  [central.asked, harbour.asked, hillside.asked, quay.asked].map((asked) => asked.length),
  [1, 1, 1, 1],
  "shelfReport asks every branch before any of them answers",
);
quay.answer(1);
hillside.fail(new Error("timeout"));
harbour.answer(0);
central.answer(7);
check.equal(
  await report,
  ["Central: 7", "Harbour: 0", "Hillside: offline", "Quay: 1"],
  "one line per branch, in the branches' order, with offline for a branch that failed",
);

const [north, south] = ["North", "South"].map(fakeBranch);
const allOffline = shelfReport([north.branch, south.branch], "Persuasion");
south.fail(new Error("down"));
north.fail(new Error("down"));
check.equal(await allOffline, ["North: offline", "South: offline"], "shelfReport resolves even when every branch fails");

check.equal(await shelfReport([], "Persuasion"), [], "no branches give no lines");
check.equal(central.asked, ["Middlemarch"], "each branch is asked about the title once");
