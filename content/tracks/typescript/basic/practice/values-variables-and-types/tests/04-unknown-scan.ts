import { lastScan, lastScanCode } from "./solution.js";

check.equal(lastScanCode, "PARCEL-0042", "the last scan code, in capitals");
check.equal(lastScan, "parcel-0042", "the scanner's reading itself, unchanged");

// This line is type-checked but never run: lastScan must still be unknown.
function typeChecks(): void {
  // @ts-expect-error lastScan is unknown, so it cannot be used without a check
  console.log(lastScan.toUpperCase());
}
check.true(typeof typeChecks === "function", "the type checks compiled");
