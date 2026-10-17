// PaidPlan and CheckIn filter unions; FetchedMember reads fetchMember's type; RENEWAL_PRICES
// has a price for each paid plan.
import {
  fetchMember,
  RENEWAL_PRICES,
  type CheckIn,
  type FetchedMember,
  type MemberEvent,
  type PaidPlan,
} from "./solution.js";

check.equal(RENEWAL_PRICES, { monthly: 45, annual: 420 }, "RENEWAL_PRICES has a price for each paid plan and nothing else");
const paid: PaidPlan[] = ["monthly", "annual"];
check.equal(paid.map((plan) => RENEWAL_PRICES[plan]), [45, 420], "the price of each paid plan");

const visit: CheckIn = { kind: "check-in", memberId: "M-001", wall: "overhang" };
const events: MemberEvent[] = [visit, { kind: "renewal", memberId: "M-001", plan: "annual" }];
check.equal(events.length, 2, "a CheckIn is a MemberEvent");

const kofi: FetchedMember = await fetchMember("M-001");
const nobody: FetchedMember = await fetchMember("M-404");
check.equal([kofi?.plan, nobody], ["annual", null], "FetchedMember holds a member or null");

function typeChecksOnly(): void {
  // @ts-expect-error a day pass is not a paid plan
  const day: PaidPlan = "day";
  // @ts-expect-error day passes are not renewed, so they have no renewal price
  RENEWAL_PRICES.day;
  // @ts-expect-error a CheckIn is only the check-in member of MemberEvent
  const renewal: CheckIn = { kind: "renewal", memberId: "M-001", plan: "annual" };
  // @ts-expect-error a check-in names a wall
  const noWall: CheckIn = { kind: "check-in", memberId: "M-001" };
  // @ts-expect-error a FetchedMember is what the promise resolves to, not the promise
  const pending: FetchedMember = fetchMember("M-001");
}
check.true(typeof typeChecksOnly === "function", "PaidPlan, CheckIn and FetchedMember are the exact derived types");
