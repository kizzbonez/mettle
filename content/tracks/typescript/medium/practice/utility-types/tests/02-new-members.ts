// NewMember is Member without id and joined, and register() adds them to a copy of the draft.
import { register, type NewMember } from "./solution.js";

const draft: NewMember = { name: "Lena Vogel", email: "lena@example.com", plan: "day", belayCertified: true };
const before = structuredClone(draft);
const lena = register(draft, "M-020", "2026-10-15");
check.equal(
  lena,
  { name: "Lena Vogel", email: "lena@example.com", plan: "day", belayCertified: true, id: "M-020", joined: "2026-10-15" },
  "register() keeps optional fields such as belayCertified",
);
check.equal(draft, before, "register() leaves the draft unchanged");
check.true((lena as object) !== draft, "register() returns a new object");

const minimal: NewMember = { name: "Tom Hale", email: "tom@example.com", plan: "annual" };
check.equal(register(minimal, "M-021", "2026-10-16").belayCertified, undefined, "belayCertified stays optional");

function typeChecksOnly(): void {
  // @ts-expect-error a new member has no id yet
  const withId: NewMember = { id: "M-022", name: "Ira", email: "ira@example.com", plan: "day" };
  // @ts-expect-error the gym sets the date joined, not the form
  const withJoined: NewMember = { name: "Ira", email: "ira@example.com", plan: "day", joined: "2026-10-16" };
  // @ts-expect-error a new member needs an email
  const noEmail: NewMember = { name: "Ira", plan: "day" };
  // @ts-expect-error "weekly" is not a plan
  const weekly: NewMember = { name: "Ira", email: "ira@example.com", plan: "weekly" };
}
check.true(typeof typeChecksOnly === "function", "NewMember is Member without id and joined");
