The interface `Guest`, the three guest types, `RuleError` and `checkDog` are written for you.
Complete the methods and functions marked with a task in `solution.go`. Note the compile-time
checks near the top: `Parrot`'s methods have pointer receivers, so the guest is a `*Parrot`.

1. **`Nightly() int`** for each guest type, in pence: a `Dog` costs 2500 a night up to and
   including 10 kg and 3500 above that, a `Cat` 1800, and a `*Parrot` 2000.
2. **`Bill(guests []Guest, nights int) int`** returns the total for all the guests staying
   `nights` nights.
3. **`Describe(g Guest) string`** returns one line for the guest list. Use a type switch:
   - a `Dog`: `Rex, a dog of 12 kg`;
   - a `Cat`: `Mog, a cat`;
   - a `*Parrot`: `Kiwi, a parrot`, or, when it has learnt words, `Kiwi, a parrot that says
     hello, goodbye` (its words in order, joined by `", "`);
   - any other kind of guest: `a guest at 900 a night`, with its own nightly price.
4. **`Walks(guests []Guest) []string`** returns the names of the dogs, in the order they appear,
   because every dog needs a walk. Find them with a comma-ok type assertion.
5. **`Admit(g Guest) error`** returns the `*RuleError` from `checkDog` for a dog it refuses, and
   `nil` for every guest the hotel can take. The tests check `Admit(g) == nil`, so be careful
   what you return: the lesson shows how a nil pointer can make a non-nil error.

Example:

```go
kiwi := &Parrot{Name: "Kiwi"}
kiwi.Learn("hello")
guests := []Guest{Dog{Name: "Rex", Kilos: 12}, Cat{Name: "Mog"}, kiwi}

Bill(guests, 3)       // 21900: (3500 + 1800 + 2000) * 3
Describe(guests[0])   // "Rex, a dog of 12 kg"
Describe(kiwi)        // "Kiwi, a parrot that says hello"
Walks(guests)         // []string{"Rex"}

Admit(Dog{Name: "Bruno", Kilos: 45}) // error "Bruno: dogs over 40 kg are not admitted"
Admit(Cat{Name: "Mog"})              // nil
Admit(guests[0])                     // nil: Rex weighs 12 kg
```
