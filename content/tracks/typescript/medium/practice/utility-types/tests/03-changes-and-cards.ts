// MemberChanges allows only name, email and plan; applyChanges copies; MemberCard is name and plan.
import { applyChanges, cardOf, type Member, type MemberCard, type MemberChanges } from "./solution.js";

const original: Readonly<Member> = {
  id: "M-007",
  name: "Sam Okoro",
  email: "sam@example.com",
  plan: "monthly",
  joined: "2026-01-09",
  belayCertified: false,
};
const before = structuredClone(original);

const moved = applyChanges(original, { email: "sam.okoro@example.com", plan: "annual" });
check.equal(
  moved,
  { ...before, email: "sam.okoro@example.com", plan: "annual" },
  "applyChanges() replaces the changed fields and keeps the rest",
);
check.equal(original, before, "applyChanges() leaves the original unchanged");
const none: MemberChanges = {};
const copy = applyChanges(original, none);
check.equal(copy, before, "no changes give an equal copy");
check.true(copy !== original, "applyChanges() returns a new object");

const card: MemberCard = cardOf(moved);
check.equal(card, { name: "Sam Okoro", plan: "annual" }, "the card shows only the name and the plan");
check.equal(Object.keys(cardOf(original)).sort(), ["name", "plan"], "the card carries no other field at run time");

function typeChecksOnly(): void {
  const rename: MemberChanges = { name: "Samuel Okoro" };
  // @ts-expect-error the date joined cannot be changed
  const rejoin: MemberChanges = { joined: "2026-02-01" };
  // @ts-expect-error belay certification is not changed through a profile edit
  const certify: MemberChanges = { belayCertified: true };
  // @ts-expect-error a card shows no email
  card.email;
  // @ts-expect-error a card needs the plan
  const planless: MemberCard = { name: "Sam" };
}
check.true(typeof typeChecksOnly === "function", "MemberChanges and MemberCard hold exactly their fields");
