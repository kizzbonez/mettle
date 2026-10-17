import { Service, TIP_PERCENT, splitBill } from "./solution.js";

// True only when A and B accept exactly the same values.
type Exactly<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

const exact: Exactly<Service, "poor" | "good" | "great"> = true;
check.true(exact, "the type Service is exactly the three service strings");

const great: Service = Service.GREAT;
const poor: Service = "poor";
check.equal([great, poor], ["great", "poor"], "the object's values are Services");
check.equal(Service, { POOR: "poor", GOOD: "good", GREAT: "great" }, "the Service object keeps its names and values");

const keyed: Exactly<keyof typeof TIP_PERCENT, Service> = true;
check.true(keyed, "TIP_PERCENT has a key for each Service and no other");
check.equal(TIP_PERCENT[great] + TIP_PERCENT[poor], 20, "TIP_PERCENT can be read with a Service");

for (const service of Object.values(Service)) {
  check.equal(splitBill(10000, ["Ana"], service).length, 1, `splitBill accepts Service value ${service}`);
}

// Type checks only: this function is never called.
function rejected(): void {
  // @ts-expect-error the Service object is read-only
  Service.GOOD = "good";
  // @ts-expect-error "superb" is not a Service
  const superb: Service = "superb";
  // @ts-expect-error a string that might be anything is not a Service
  splitBill(1000, ["Ana"], String(superb));
  // @ts-expect-error TIP_PERCENT is read-only
  TIP_PERCENT.great = 20;
  // @ts-expect-error TIP_PERCENT has no rate for "superb"
  console.log(TIP_PERCENT["superb"]);
}
void rejected;
