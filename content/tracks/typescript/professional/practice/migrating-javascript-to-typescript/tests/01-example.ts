import { Service, receipt, splitBill, totalOf, type Share } from "./solution.js";

// The example from the instructions.

const table = ["Ana", "Bo", "Cy"] as const;
const shares: Share[] = splitBill(4999, table, Service.GOOD, 5);
check.equal(
  shares,
  [
    { diner: "Ana", cents: 1835 },
    { diner: "Bo", cents: 1835 },
    { diner: "Cy", cents: 1835 },
  ],
  "splitBill adds the tip and rounds each share up to 5 cents",
);
check.equal(
  receipt(shares, (share) => `${share.diner}: ${(share.cents / 100).toFixed(2)}`),
  "Ana: 18.35\nBo: 18.35\nCy: 18.35",
  "receipt formats one line per share",
);
check.equal(totalOf(shares), 5505, "totalOf adds the shares up");

// Type checks only: this function is never called.
function rejected(): void {
  // @ts-expect-error "superb" is not a Service
  splitBill(4999, table, "superb");
}
void rejected;
