Derive the types from `Member`, `Plan`, `MemberEvent` and `fetchMember` with utility types, then
write the three functions. Most tests check your **types**: lines the compiler must reject are
marked `// @ts-expect-error`, so a type that lets too much through fails a test.

1. **`NewMember`**: what the sign-up form sends, `Member` without `id` and `joined` (`Omit`).
2. **`MemberChanges`**: what a profile edit may change, `name`, `email` and `plan`, each optional,
   and nothing else (`Partial` of a `Pick`).
3. **`MemberCard`**: only `name` and `plan` (`Pick`).
4. **`PaidPlan`**: every `Plan` except `"day"` (`Exclude`).
5. **`CheckIn`**: the `"check-in"` member of `MemberEvent` (`Extract`).
6. **`FetchedMember`**: what awaiting `fetchMember` gives, `Member | null`, read from the function
   itself with `Awaited`, `ReturnType` and `typeof`.
7. **`RENEWAL_PRICES: Record<PaidPlan, number>`**: monthly 45, annual 420.
8. **`register(draft: NewMember, id: string, joined: string): Member`** returns a new member made
   of the draft's fields plus `id` and `joined`.
9. **`applyChanges(member: Readonly<Member>, changes: MemberChanges): Member`** returns a new
   member with the changed fields replaced. The original is not changed.
10. **`cardOf(member: Member): MemberCard`** returns a new object with only `name` and `plan`:
    the card must not carry the email or anything else at run time either.

Example:

```ts
const ana = register({ name: "Ana Reyes", email: "ana@example.com", plan: "monthly" }, "M-014", "2026-10-01");
// { name: "Ana Reyes", email: "ana@example.com", plan: "monthly", id: "M-014", joined: "2026-10-01" }
applyChanges(ana, { plan: "annual" }).plan    // "annual"
ana.plan                                      // still "monthly"
cardOf(ana)                                   // { name: "Ana Reyes", plan: "monthly" }
RENEWAL_PRICES.annual                         // 420
const kofi: FetchedMember = await fetchMember("M-001");
applyChanges(ana, { id: "M-999" })            // compile error: an id cannot be changed
```
