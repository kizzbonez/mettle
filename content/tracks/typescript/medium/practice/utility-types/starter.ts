// Climbing Gym Members
//
// Plan, Member, MemberEvent and fetchMember are complete: keep them as they are, and derive every
// other type from them with utility types instead of writing fields out again.

export type Plan = "day" | "monthly" | "annual";

export interface Member {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  joined: string;
  belayCertified?: boolean;
}

export type MemberEvent =
  | { kind: "check-in"; memberId: string; wall: string }
  | { kind: "renewal"; memberId: string; plan: Plan }
  | { kind: "incident"; memberId: string; note: string };

// Looks a member up in the gym's records (here, a single member, so the lab needs no database).
export async function fetchMember(id: string): Promise<Member | null> {
  if (id !== "M-001") {
    return null;
  }
  return { id, name: "Kofi Mensah", email: "kofi@example.com", plan: "annual", joined: "2025-04-12", belayCertified: true };
}

// Tasks 1 to 6: each of these is too wide or too vague. Replace it with the utility types the
// instructions describe.
export type NewMember = Member;
export type MemberChanges = Member;
export type MemberCard = Member;
export type PaidPlan = Plan;
export type CheckIn = MemberEvent;
export type FetchedMember = unknown;

// Task 7: once PaidPlan is right, a day pass has no renewal price. Fill in the real prices.
export const RENEWAL_PRICES: Record<PaidPlan, number> = { day: 0, monthly: 0, annual: 0 };

// Task 8
export function register(draft: NewMember, id: string, joined: string): Member {
  throw new Error("Not implemented");
}

// Task 9
export function applyChanges(member: Readonly<Member>, changes: MemberChanges): Member {
  throw new Error("Not implemented");
}

// Task 10
export function cardOf(member: Member): MemberCard {
  throw new Error("Not implemented");
}
