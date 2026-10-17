import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { Service, TIP_PERCENT, receipt, splitBill, totalOf } from "./solution.js";

// The original JavaScript module, run next to the TypeScript version.
interface OriginalShare {
  diner: string;
  cents: number;
}
interface Original {
  Service: Record<string, string>;
  TIP_PERCENT: Record<string, number>;
  splitBill(totalCents: number, diners: readonly string[], service: string, roundTo?: number): OriginalShare[];
  receipt(shares: readonly OriginalShare[], format: (share: OriginalShare) => string): string;
  totalOf(shares: readonly OriginalShare[]): number;
}
const original = (await import(pathToFileURL("data/split-bill.js").href)) as Original;

check.equal<Record<string, string>>({ ...Service }, original.Service, "Service holds the same names and values as the original");
check.equal<Record<string, number>>({ ...TIP_PERCENT }, original.TIP_PERCENT, "TIP_PERCENT holds the same rates as the original");

const everyone = ["Ana", "Bo", "Cy", "Dee", "Eli", "Fay"];
let compared = 0;
for (const total of [0, 1, 99, 999, 1000, 4999, 12345, 33333, 100000]) {
  for (let count = 1; count <= everyone.length; count++) {
    const diners = everyone.slice(0, count);
    for (const service of ["poor", "good", "great"] as const) {
      for (const roundTo of [undefined, 1, 5, 10, 25, 100]) {
        const mine = roundTo === undefined ? splitBill(total, diners, service) : splitBill(total, diners, service, roundTo);
        const theirs = original.splitBill(total, diners, service, roundTo);
        if (!isDeepStrictEqual(mine, theirs)) {
          check.equal(mine, theirs, `splitBill(${total}, ${count} diners, "${service}", ${roundTo}) gives the original's shares`);
        }
        const line = (share: OriginalShare): string => `${share.diner}=${share.cents}`;
        if (receipt(mine, line) !== original.receipt(theirs, line) || totalOf(mine) !== original.totalOf(theirs)) {
          fail(`receipt or totalOf differs from the original for splitBill(${total}, ${count} diners, "${service}", ${roundTo})`);
        }
        compared += 1;
      }
    }
  }
}
check.equal(compared, 972, "every one of the 972 bills was compared");

check.throws(() => splitBill(1000, [], "good"), "splitting between nobody throws, as the original does", RangeError);
check.equal(receipt([], (share) => share.diner), "", "a receipt of no shares is empty");
check.equal(totalOf([]), 0, "the total of no shares is 0");

// receipt calls format once per share, with the share alone.
const calls: unknown[][] = [];
receipt(splitBill(900, ["Ana", "Bo"], "poor"), (...args: unknown[]) => {
  calls.push(args);
  return "";
});
check.equal(calls, [[{ diner: "Ana", cents: 473 }], [{ diner: "Bo", cents: 473 }]], "format receives each share and nothing else");
