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

export async function fetchMember(id: string): Promise<Member | null> {
  if (id !== "M-001") {
    return null;
  }
  return { id, name: "Kofi Mensah", email: "kofi@example.com", plan: "annual", joined: "2025-04-12", belayCertified: true };
}

export type NewMember = Omit<Member, "id" | "joined">;
export type MemberChanges = Partial<Pick<Member, "name" | "email" | "plan">>;
export type MemberCard = Pick<Member, "name" | "plan">;
export type PaidPlan = Exclude<Plan, "day">;
export type CheckIn = Extract<MemberEvent, { kind: "check-in" }>;
export type FetchedMember = Awaited<ReturnType<typeof fetchMember>>;

export const RENEWAL_PRICES: Record<PaidPlan, number> = { monthly: 45, annual: 420 };

export function register(draft: NewMember, id: string, joined: string): Member {
  return { ...draft, id, joined };
}

export function applyChanges(member: Readonly<Member>, changes: MemberChanges): Member {
  return { ...member, ...changes };
}

export function cardOf(member: Member): MemberCard {
  return { name: member.name, plan: member.plan };
}
