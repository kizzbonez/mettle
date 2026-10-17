`Resident` is complete: do not change it. Fix the return type of `findResident` and write the
four exported functions. Do not use the non-null assertion `!` anywhere.

1. **`findResident(residents: readonly Resident[], flat: string): Resident | undefined`** returns
   the resident whose `flat` is exactly `flat`, or `undefined` when nobody lives there. The
   starter's return type is `Resident`, which promises a resident every time: change it, or
   `find` will not compile. A test checks that callers are made to handle `undefined`.
2. **`callNumber(residents: readonly Resident[], flat: string): string`** returns the phone
   number of the resident in `flat`, or `"front desk"` when nobody lives there **or** the resident
   gave no phone number. Use `findResident`, optional chaining `?.` and `??`: it fits in one line.
3. **`ringVolume(resident: Resident): number`** returns the resident's `ringVolume`, or 5 when it
   is not set. A volume of 0 means muted and must stay 0, so use `??`, not `||`.
4. **`buzzerName(resident: Resident): string`** returns the name, followed by
   `" (away until <awayUntil>)"` when `awayUntil` is not `null`. Check against `null` first.

Example:

```ts
const residents: Resident[] = [
  { name: "Ines", flat: "1A", phone: "555-0142", ringVolume: 0, awayUntil: null },
  { name: "Tom", flat: "2B", awayUntil: "12 May" },
];

findResident(residents, "2B")   // Tom's object
findResident(residents, "9Z")   // undefined
callNumber(residents, "1A")     // "555-0142"
callNumber(residents, "2B")     // "front desk": Tom gave no phone number
callNumber(residents, "9Z")     // "front desk": nobody lives in 9Z
ringVolume(residents[0])        // 0: Ines muted her buzzer
ringVolume(residents[1])        // 5: Tom never set a volume
buzzerName(residents[0])        // "Ines"
buzzerName(residents[1])        // "Tom (away until 12 May)"
```
