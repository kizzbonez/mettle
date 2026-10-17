// The example from the instructions.
import { applyChanges, cardOf, fetchMember, register, RENEWAL_PRICES, type FetchedMember } from "./solution.js";

const ana = register({ name: "Ana Reyes", email: "ana@example.com", plan: "monthly" }, "M-014", "2026-10-01");
check.equal(
  ana,
  { name: "Ana Reyes", email: "ana@example.com", plan: "monthly", id: "M-014", joined: "2026-10-01" },
  "register() builds the member from the draft, the id and the date joined",
);
check.equal(applyChanges(ana, { plan: "annual" }).plan, "annual", "applyChanges() changes the plan");
check.equal(ana.plan, "monthly", "the original member keeps its plan");
check.equal(cardOf(ana), { name: "Ana Reyes", plan: "monthly" }, "cardOf() keeps only the name and the plan");
check.equal(RENEWAL_PRICES.annual, 420, "the annual renewal price");

const kofi: FetchedMember = await fetchMember("M-001");
check.equal(kofi?.name, "Kofi Mensah", "a FetchedMember holds what fetchMember resolves to");

function typeChecksOnly(): void {
  // @ts-expect-error an id cannot be changed
  applyChanges(ana, { id: "M-999" });
}
check.true(typeof typeChecksOnly === "function", "MemberChanges refuses an id");
