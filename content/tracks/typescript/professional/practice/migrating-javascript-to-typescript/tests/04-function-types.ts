import { receipt, splitBill, totalOf, type Service, type Share } from "./solution.js";

// True only when A and B accept exactly the same values.
type Exactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const parameters: Exactly<Parameters<typeof splitBill>, [number, readonly string[], Service, number?]> = true;
const returns: Exactly<ReturnType<typeof splitBill>, Share[]> = true;
const formats: Exactly<Parameters<typeof receipt>, [readonly Share[], (share: Share) => string]> = true;
const totals: Exactly<Parameters<typeof totalOf>, [readonly Share[]]> = true;
check.true(parameters && returns && formats && totals, "the three functions have the signatures from the instructions");

const share: Share = { diner: "Cy", cents: 250 };
const shareKeys: Exactly<keyof Share, "diner" | "cents"> = true;
check.true(shareKeys, "a Share has exactly the fields diner and cents");

// Readonly inputs are accepted.
const table = ["Ana", "Bo"] as const;
const shares: Share[] = splitBill(2000, table, "great");
const frozen: readonly Share[] = [...shares, share];
check.equal(totalOf(frozen), 2550, "totalOf accepts a readonly array");
check.equal(receipt(frozen, (item) => item.diner), "Ana\nBo\nCy", "receipt accepts a readonly array");
check.equal(splitBill(1000, table, "poor", 50).map((item) => item.cents), [550, 550], "roundTo may be given");

// Type checks only: this function is never called.
function rejected(): void {
  // @ts-expect-error the fields of a Share are read-only
  shares[0].cents = 0;
  // @ts-expect-error a Share needs cents
  const half: Share = { diner: "Ana" };
  // @ts-expect-error the total is a number, not a string
  splitBill("2000", table, "good");
  // @ts-expect-error the diners are strings
  splitBill(2000, [1, 2], "good");
  // @ts-expect-error roundTo is a number
  splitBill(2000, table, "good", "5");
  // @ts-expect-error format receives a Share, not a number
  receipt(shares, (amount: number) => String(amount));
  // @ts-expect-error format must return a string
  receipt(shares, (item) => item.cents);
  // @ts-expect-error totalOf takes shares, not numbers
  totalOf([100, 200]);
  void half;
}
void rejected;
